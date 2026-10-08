// 秋招雷达 · 留港专区 · 香港公司官方层
// 数据政策：只收录官方来源（公司官网 / 官方招聘页 / 官方公众号 / 高校就业网发布的官方信息）
// 字段说明：
//   id         唯一英文 id（小写）
//   name       公司名
//   industry   行业（金融 / 专业服务 / 科技 / 快消 / 零售 / 医疗 / 咨询 / 猎头 …）
//   jobType    岗位类型：全职 / 管培生MT / 毕业培训生 / 暑期实习 / 冬季实习 / 普通实习 / 猎头顾问
//   batch      项目名，如 "2027 MT"、"2027 Summer Intern"
//   positions  岗位方向数组，如 ["人力资源","猎头","管理培训生"]
//   startDate  开放时间 "YYYY-MM-DD"，"" = 未知
//   endDate    截止时间 "YYYY-MM-DD"，"" = 未知/滚动招聘
//   status     进行中 / 即将截止 / 即将开启 / 未开始 / 已结束 / 待核实
//   visa       签证支持：赞助 / IANG友好 / 需自带工作权 / 待核实
//   languages  语言要求，如 "英语+粤语" / "英语" / "普通话"
//   applyUrl   官方投递入口（必须 http/https）
//   careerUrl  官方招聘主页
//   note       一句话备注
//   source / sourceUrl / sourceLabel  信息来源
//   verified   true = 官方入口已实测可访问
window.QIUZHAO_HK_DATA = {
  updatedAt: "2026-10-08",
  sourceNote: "留港专区：只收录官方来源；未核实字段标注「待核实」，投递前请以公司官方页面为准",
  companies: [
    // 添加示例（复制到下方并取消注释）：
    // { id: "hsbc", name: "汇丰香港", industry: "金融", jobType: "管培生MT", batch: "2027 MT",
    //   positions: ["管理培训生", "人力资源"], startDate: "", endDate: "", status: "待核实",
    //   visa: "IANG友好", languages: "英语+粤语",
    //   applyUrl: "https://www.hsbc.com/careers", careerUrl: "https://www.hsbc.com/careers",
    //   note: "示例条目", source: "官网", sourceUrl: "https://www.hsbc.com/careers",
    //   sourceLabel: "汇丰招聘官网", verified: true }
  ],
  reviewQueue: []
};
