const SENTENCES = {
  cet4: [
    { en: 'He abandoned his plan to travel.', cn: '他放弃了旅行计划。', source: 'cet4' },
    { en: 'She has a brilliant mind.', cn: '她有一个聪明的头脑。', source: 'cet4' },
    { en: 'The photographer captured the sunset.', cn: '摄影师捕捉到了日落。', source: 'cet4' },
    { en: 'The company declined to comment.', cn: '公司拒绝置评。', source: 'cet4' },
    { en: 'They established a new school.', cn: '他们建立了一所新学校。', source: 'cet4' },
    { en: 'The plants flourished in the sun.', cn: '植物在阳光下茂盛生长。', source: 'cet4' },
    { en: 'She showed genuine concern.', cn: '她表现出真诚的关心。', source: 'cet4' },
    { en: 'Do not hesitate to contact us.', cn: '请随时联系我们。', source: 'cet4' },
    { en: 'The graph illustrates the trend.', cn: '图表说明了这一趋势。', source: 'cet4' },
    { en: 'How can you justify such behavior?', cn: '你如何为这种行为辩护？', source: 'cet4' },
  ],
  cet6: [
    { en: 'The diplomat negotiated a peaceful resolution.', cn: '外交官协商了和平解决方案。', source: 'cet6' },
    { en: 'Her perseverance led to eventual success.', cn: '她的毅力最终导致了成功。', source: 'cet6' },
    { en: 'The hypothesis was confirmed by the experiment.', cn: '实验证实了这一假设。', source: 'cet6' },
  ],
  ielts: [
    { en: 'Urbanization poses significant challenges to infrastructure.', cn: '城市化对基础设施构成重大挑战。', source: 'ielts' },
    { en: 'The data indicates a correlation between diet and longevity.', cn: '数据表明饮食与寿命之间存在相关性。', source: 'ielts' },
  ],
  toefl: [
    { en: 'The lecture elaborated on the theory of evolution.', cn: '讲座详细阐述了进化论。', source: 'toefl' },
    { en: 'Students are required to synthesize information from multiple sources.', cn: '学生需要综合多个来源的信息。', source: 'toefl' },
  ],
  academic: [
    { en: 'The paper presents a novel framework for analyzing semantic networks.', cn: '该论文提出了一个分析语义网络的新框架。', source: 'academic' },
    { en: 'Subsequent studies have corroborated these findings across diverse populations.', cn: '后续研究在不同人群中证实了这些发现。', source: 'academic' },
  ],
}

/** 预留：用户自定义句子库 */
const personalSentences = []

export { SENTENCES, personalSentences }
