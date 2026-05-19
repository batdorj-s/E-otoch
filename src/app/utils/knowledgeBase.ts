export interface KnowledgeChunk {
  category: "salt" | "tobacco" | "alcohol" | "obesity" | "hypertension" | "diabetes" | "general";
  content: string;
  source: string;
}

export const medicalKnowledge: KnowledgeChunk[] = [
  // СУДАЛГААНЫ БАРИМТУУД: ДАВСНЫ ХЭРЭГЛЭЭ
  {
    category: "salt",
    content: "Монголчуудын давсны дундаж хэрэглээ өдөрт 11.1 грамм байгаа нь ДЭМБ-ын зөвлөмжөөс (өдөрт 5 граммаас бага) 2 дахин их байна. Энэ нь даралт ихсэлт болон зүрх судасны өвчлөлийн гол шалтгаан болдог.",
    source: "STEPS 2013 Судалгааны Тайлан"
  },
  {
    category: "salt",
    content: "Монгол улсын хүн амын 70.4% нь өдөр тутамдаа давстай цай уудаг уламжлалтай бөгөөд энэ нь давсны өдөр тутмын хэт их хэрэглээнд шууд нөлөөлж байна.",
    source: "STEPS 2005 & 2013 Судалгааны Тайлан"
  },
  {
    category: "salt",
    content: "Нийт судалгаанд оролцогчдын 20.4% нь л давс багатай хоол хүнс сонгодог бөгөөд зөвхөн 10.4% нь бүтээгдэхүүний шошгон дээрх давс эсвэл натрийн хэмжээг шалгадаг дадалтай байна.",
    source: "STEPS 2013 Судалгааны Тайлан"
  },

  // СУДАЛГААНЫ БАРИМТУУД: АРТЕРИЙН ДАРАЛТ ИХСЭЛТ
  {
    category: "hypertension",
    content: "Монгол улсын 15-64 насны хүн амын 27.5% нь артерийн даралт ихсэлттэй байна. Үүнээс эрэгтэйчүүдийн дунд даралт ихсэлт 30.5% байгаа нь эмэгтэйчүүдийнхээс (24.5%) мэдэгдэхүйц өндөр байна.",
    source: "STEPS 2013 Судалгааны Тайлан"
  },
  {
    category: "hypertension",
    content: "Артерийн даралт ихсэлттэй оношлогдсон нийт хүмүүсийн 71.7% нь өмнө нь өөрийгөө даралт ихсэлттэй гэдгийг мэддэггүй байсан бөгөөд урьдчилан сэргийлэх үзлэгээр илэрчээ.",
    source: "STEPS 2013 Судалгааны Тайлан"
  },
  {
    category: "hypertension",
    content: "Монгол улсад зүрх судасны өвчлөлөөс үүдэлтэй нийт нас баралтын 52% нь артерийн даралт ихсэлттэй шууд холбоотой байдаг тул даралтыг тогтвортой хянах нь амь насанд маш чухал ач холбогдолтой.",
    source: "STEPS 2005 Судалгааны Тайлан"
  },

  // СУДАЛГААНЫ БАРИМТУУД: ЖИН БА ТАРГАЛАЛТ
  {
    category: "obesity",
    content: "Монгол улсын 15-64 насны хүн амын 54.4% нь илүүдэл жинтэй эсвэл таргалалттай (BMI >= 25) байна. Үүнээс 19.7% нь хэт таргалалттай (BMI >= 30) байна.",
    source: "STEPS 2013 Судалгааны Тайлан"
  },
  {
    category: "obesity",
    content: "Хэвлийн буюу төвийн таргалалт (Central Obesity) нийт хүн амын 56.8%-д илэрсэн. Энэ нь эмэгтэйчүүдэд (69.3%) эрэгтэйчүүдээс (44.4%) хамаагүй өндөр байна.",
    source: "STEPS 2013 Судалгааны Тайлан"
  },
  {
    category: "obesity",
    content: "Илүүдэл жин ба таргалалтын тархалт Монгол улсад жилээс жилд өсөж байгаа бөгөөд 2005 оны үзүүлэлтээс (46.5%) 2013 он гэхэд (54.4%) даруй 14%-иар өссөн байна.",
    source: "STEPS 2005 & 2013 Судалгааны Тайлан"
  },

  // СУДАЛГААНЫ БАРИМТУУД: ЧИХРИЙН ШИЖИН
  {
    category: "diabetes",
    content: "Монголд чихрийн шижингийн тархалт хүн амын дунд 6.9% байна. Далд хэлбэрийн чихрийн шижин буюу өлөн үеийн глюкозын өөрчлөлт (Impaired Fasting Glucose) 8.3%-тай байна.",
    source: "STEPS 2013 Судалгааны Тайлан"
  },
  {
    category: "diabetes",
    content: "Чихрийн шижин оношлогдсон хүмүүсийн дөнгөж 7.4% нь л цусан дахь глюкозын хэмжээгээ хэвийн түвшинд барьж, хяналтаа сайн хэрэгжүүлж байна.",
    source: "STEPS 2013 Судалгааны Тайлан"
  },

  // СУДАЛГААНЫ БАРИМТУУД: ТАМХИДАЛТ
  {
    category: "tobacco",
    content: "Монгол улсын насанд хүрсэн хүн амын 27.1% нь тамхи татдаг бөгөөд эрэгтэйчүүдийн дунд тамхины хэрэглээ маш өндөр буюу 49.1% (бараг 2 эрэгтэй тутмын 1 нь) байна.",
    source: "STEPS 2013 Судалгааны Тайлан"
  },
  {
    category: "tobacco",
    content: "Монгол улсад тамхи татаж эхлэх дундаж нас залуужиж 19 насанд хүрсэн байна.",
    source: "STEPS 2005 & 2013 Судалгааны Тайлан"
  },

  // СУДАЛГААНЫ БАРИМТУУД: АРХИ, СОГТУУРУУЛАХ УНДАА
  {
    category: "alcohol",
    content: "Монгол эрэгтэйчүүдийн 37.5% нь нэг удаагийн хэрэглээндээ 6 болон түүнээс олон стандарт нэгж согтууруулах ундаа хэрэглэдэг (хэтрүүлэн хэрэглэх буюу Binge drinking) бөгөөд энэ нь эрүүл мэндэд маш өндөр эрсдэл үүсгэж байна.",
    source: "STEPS 2013 Судалгааны Тайлан"
  },
  {
    category: "alcohol",
    content: "Нэг стандарт ундаа гэдэг нь 10 грамм цэвэр спирт агуулсан согтууруулах ундааг хэлнэ (Жишээлбэл, 280мл шар айраг, 30мл цагаан архи, эсвэл 90мл дарс).",
    source: "STEPS 2013 Судалгааны Тайлан"
  }
];

export const getRelevantKnowledge = (answers: Record<string, string>, aiResults: any): string => {
  let context = "";
  const weight = Number(answers.weight || 65);
  const height = Number(answers.height || 170);
  const bmi = weight / (Math.pow(height / 100, 2));
  const systolic = Number(answers.bp_systolic || 120);
  const saltIntake = Number(answers.salt_intake || 5);
  
  if (systolic >= 140 || aiResults.heartRisk > 40 || saltIntake > 7) {
    context += medicalKnowledge
      .filter(k => k.category === "hypertension" || k.category === "salt")
      .map(k => `- ${k.content} [Эх сурвалж: ${k.source}]`)
      .join("\n") + "\n";
  }
  
  if (aiResults.diabetesRisk > 40 || bmi > 27) {
    context += medicalKnowledge
      .filter(k => k.category === "diabetes")
      .map(k => `- ${k.content} [Эх сурвалж: ${k.source}]`)
      .join("\n") + "\n";
  }
  
  if (bmi > 25) {
    context += medicalKnowledge
      .filter(k => k.category === "obesity")
      .map(k => `- ${k.content} [Эх сурвалж: ${k.source}]`)
      .join("\n") + "\n";
  }

  if (answers.smoking === "current") {
    context += medicalKnowledge
      .filter(k => k.category === "tobacco")
      .map(k => `- ${k.content} [Эх сурвалж: ${k.source}]`)
      .join("\n") + "\n";
  }

  if (answers.alcohol_freq && answers.alcohol_freq !== "never") {
    context += medicalKnowledge
      .filter(k => k.category === "alcohol")
      .map(k => `- ${k.content} [Эх сурвалж: ${k.source}]`)
      .join("\n") + "\n";
  }

  return context || "Монгол улсын эрүүл мэндийн ерөнхий судалгааны статистик үзүүлэлтүүдийг зөвлөгөөндөө ашиглана уу.";
};
