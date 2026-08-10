// 秋招雷达 · 每人可投递次数与规则（官方已核实层）
// 政策：只有公司官方公告/校招官网/高校就业网发布的官方信息才写入；
// limit: 数字 = 每人最多可投递次数；"" = 官方明确无上限或规则以官网为准。
// 未收录的公司 = 官网未明确，页面会提示以官网为准。
window.QIUZHAO_APPLY_RULES = {
  "mihoyo": {
    limit: 1,
    note: "2027届秋招：每个人只能投递1次，且仅能投递1个职位，请谨慎选择",
    sourceUrl: "https://job.bit.edu.cn/frontpage/bit/html/recruitmentinfoForm.html?positionDetailId=ce3a116067af4b0d8bede775d0f2f201&",
    sourceLabel: "北京理工大学就业资讯网（公司官方信息）",
    verified: true
  },
  "bytedance": {
    limit: 4,
    note: "全年开放投递、共4次投递机会；2026年内2次，2027年1月1日起重新获得2次（两次机会独立），岗位招满即止",
    sourceUrl: "https://haue.goworkla.cn/module/position_brief_detail/id-113374/nid-6488",
    sourceLabel: "河南工程学院就业信息网（公司官方信息）",
    verified: true
  },
  "dji": {
    limit: 1,
    note: "每位同学限投递1个职位，投递后无法更新已投递内容",
    sourceUrl: "https://jy.xmu.edu.cn/campus/view/id/1001542",
    sourceLabel: "厦门大学就业网（公司官方信息）",
    verified: true
  },
  "lilith": {
    limit: 2,
    note: "提前批：每次最多同时投递2个岗位，岗位流程终止后可继续投其他岗位；提前批不占用正式批机会（正式批另算）",
    sourceUrl: "https://cug.91wllm.cn/campus/view/id/1000649",
    sourceLabel: "中国地质大学就业信息网（公司官方信息）",
    verified: true
  },
  "pinduoduo": {
    limit: 2,
    note: "提前批结果不影响正式批投递（机会+1，合计2次机会）；部分岗位仅提前批开放，正式批时间以官网为准",
    sourceUrl: "https://cug.91wllm.cn/campus/view/id/1000411",
    sourceLabel: "中国地质大学就业信息网（公司官方信息）",
    verified: true
  },
  "tencent": {
    limit: "",
    unlimited: true,
    note: "常规校招投递无上限：只要当前未在面试流程中，可随时切换岗位；青云计划为独立人才项目（报名8/22截止）",
    sourceUrl: "https://jyw.gpnu.edu.cn/info/1148/11813.htm",
    sourceLabel: "广东技术师范大学就业网（公司官方信息）",
    verified: true
  },
  "alibaba": {
    limit: 2,
    perScope: true,
    note: "可投多个业务集团/公司且流程并行；每个业务集团/公司只有1次投递机会，最多选择2个意向岗位（按意向顺序流转）",
    sourceUrl: "https://job.nwpu.edu.cn/frontpage/nwpu/html/recruitmentinfoForm.html?positionDetailId=a458bd6d4cb443a69b52481e66e0da4b&",
    sourceLabel: "西北工业大学就业信息网（公司官方信息）",
    verified: true
  },
  "netease_game": {
    limit: 2,
    perScope: true,
    note: "网易互娱：每位同学最多可投递2个职位（志愿），志愿进入流程前可修改/增加；投递过2027届实习项目者可再投校招。雷火为独立事业群、规则另计（部分岗位8/11开启）",
    sourceUrl: "https://job.zzu.edu.cn/campus/view/id/1018703",
    sourceLabel: "郑州大学就业网（公司官方信息）",
    verified: true
  },
  "baidu": {
    limit: "",
    unlimited: true,
    note: "投递次数无上限（同一时间只能有1个职位在流程中，流程结束后可投新职位）；常规校招/AIDU/管培生可各投1个、互不冲突",
    sourceUrl: "https://cug.91wllm.cn/campus/view/id/1000821",
    sourceLabel: "中国地质大学就业信息网（公司官方信息）",
    verified: true
  },
  "oppo": {
    limit: 2,
    note: "每位同学最多可申请2个岗位；第一志愿优先处理，第二志愿不同步推进，第一志愿未匹配成功才进入第二志愿",
    sourceUrl: "https://job.snut.edu.cn/info/1051/59355.htm",
    sourceLabel: "陕西理工大学就业信息网（公司官方信息）",
    verified: true
  },
  "cyou": {
    limit: 2,
    note: "2027届秋招每人可投递2次；提前批未通过不影响正式批投递（提前批与正式批流程打通）",
    sourceUrl: "https://app.mokahr.com/campus_apply/cyou-inc/42233#/jobs",
    sourceLabel: "畅游校招官网（Moka）",
    verified: true
  },
  "hypergryph": {
    limit: 1,
    note: "提前批：每位同学仅能投递1个提前批岗位（可勾选接受调剂）；提前批不影响27届秋招正式批投递；引力波策划专项7/16-8/10限投1次",
    sourceUrl: "https://app.mokahr.com/campus-recruitment/hypergryph/26326#/jobs",
    sourceLabel: "鹰角网络招聘官网（Moka）",
    verified: true
  },
  "qunar": {
    limit: 1,
    note: "2027届校招每人限投1个岗位",
    sourceUrl: "https://campus.qunar.com",
    sourceLabel: "去哪儿校招官网",
    verified: true
  },
  "jd": {
    limit: "",
    unlimited: true,
    note: "JDS新星计划、TET管理培训生、JDYOUNG实习生计划互不冲突、可同步投递；同一计划内可投岗位数以官网为准",
    sourceUrl: "https://careers.jd.com/",
    sourceLabel: "京东校招官网",
    verified: true
  },
  "dewu": {
    limit: "",
    note: "暑期实习至多可投2个岗位（含内推），实习与秋招项目独立开展、互不影响；秋招正式批投递规则以官网为准",
    sourceUrl: "https://job.xmut.edu.cn/info/1007/11573.htm",
    sourceLabel: "厦门理工学院就业网（公司官方信息）",
    verified: true
  }
};
