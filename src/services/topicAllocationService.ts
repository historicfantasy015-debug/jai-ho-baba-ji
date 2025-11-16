import { supabase } from '../lib/supabase';
import type { QuestionConfig, TopicAllocation } from '../types';

export async function calculateTopicAllocations(
  questionConfig: QuestionConfig
): Promise<TopicAllocation[]> {
  const topicsWithQuestions = await fetchTopicsWithQuestions(questionConfig);

  if (topicsWithQuestions.length === 0) {
    return [];
  }

  const totalQuestions = topicsWithQuestions.reduce((sum, t) => sum + t.questionCount, 0);

  const allocations: TopicAllocation[] = topicsWithQuestions.map(topic => {
    const weightagePercent = topic.questionCount / totalQuestions;
    const questionsToGenerate = Math.round(weightagePercent * questionConfig.numberOfQuestions);

    return {
      topicId: topic.topicId,
      topicName: topic.topicName,
      weightage: topic.questionCount,
      questionsToGenerate
    };
  });

  let totalAllocated = allocations.reduce((sum, item) => sum + item.questionsToGenerate, 0);
  const diff = questionConfig.numberOfQuestions - totalAllocated;

  if (diff !== 0 && allocations.length > 0) {
    allocations[0].questionsToGenerate += diff;
  }

  return allocations;
}

interface TopicWithQuestions {
  topicId: string;
  topicName: string;
  questionCount: number;
}

async function fetchTopicsWithQuestions(
  config: QuestionConfig
): Promise<TopicWithQuestions[]> {
  const query = `
    SELECT
      t.id as topic_id,
      t.name as topic_name,
      COUNT(qtw.id) as question_count
    FROM topics t
    INNER JOIN chapters ch ON t.chapter_id = ch.id
    INNER JOIN subjects s ON (ch.unit_id IN (SELECT id FROM units WHERE subject_id = s.id) OR ch.course_id = s.course_id)
    INNER JOIN questions_topic_wise qtw ON qtw.topic_id = t.id
    WHERE s.course_id = $1
      AND qtw.question_type = $2
      ${config.slotId ? 'AND qtw.slot_id = $3' : ''}
      ${config.partId ? `AND qtw.part_id = $${config.slotId ? 4 : 3}` : ''}
    GROUP BY t.id, t.name
    HAVING COUNT(qtw.id) > 0
    ORDER BY COUNT(qtw.id) DESC
  `;

  const params: any[] = [config.courseId, config.questionType];
  if (config.slotId) params.push(config.slotId);
  if (config.partId) params.push(config.partId);

  const { data, error } = await supabase.rpc('execute_raw_query', {
    query,
    params
  });

  if (error) {
    console.error('Error fetching topics:', error);

    return await fetchTopicsDirectly(config);
  }

  if (!data || data.length === 0) {
    return await fetchTopicsDirectly(config);
  }

  return data.map((row: any) => ({
    topicId: row.topic_id,
    topicName: row.topic_name,
    questionCount: parseInt(row.question_count)
  }));
}

async function fetchTopicsDirectly(config: QuestionConfig): Promise<TopicWithQuestions[]> {
  const { data: course } = await supabase
    .from('courses')
    .select('id')
    .eq('id', config.courseId)
    .maybeSingle();

  if (!course) return [];

  const { data: subjects } = await supabase
    .from('subjects')
    .select('id')
    .eq('course_id', config.courseId);

  if (!subjects || subjects.length === 0) return [];

  const subjectIds = subjects.map(s => s.id);

  const { data: units } = await supabase
    .from('units')
    .select('id')
    .in('subject_id', subjectIds);

  const unitIds = units?.map(u => u.id) || [];

  const { data: chapters } = await supabase
    .from('chapters')
    .select('id')
    .or(`unit_id.in.(${unitIds.join(',')}),course_id.eq.${config.courseId}`);

  if (!chapters || chapters.length === 0) return [];

  const chapterIds = chapters.map(c => c.id);

  const { data: topics } = await supabase
    .from('topics')
    .select('id, name, chapter_id')
    .in('chapter_id', chapterIds);

  if (!topics || topics.length === 0) return [];

  const topicsWithCounts: TopicWithQuestions[] = [];

  for (const topic of topics) {
    let query = supabase
      .from('questions_topic_wise')
      .select('id', { count: 'exact', head: true })
      .eq('topic_id', topic.id)
      .eq('question_type', config.questionType);

    if (config.slotId) {
      query = query.eq('slot_id', config.slotId);
    }
    if (config.partId) {
      query = query.eq('part_id', config.partId);
    }

    const { count } = await query;

    if (count && count > 0) {
      topicsWithCounts.push({
        topicId: topic.id,
        topicName: topic.name,
        questionCount: count
      });
    }
  }

  return topicsWithCounts.sort((a, b) => b.questionCount - a.questionCount);
}
