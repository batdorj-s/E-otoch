import * as ort from 'onnxruntime-web';

export class HealthAI {
  private static session: ort.InferenceSession | null = null;

  static async init() {
    if (!this.session) {
      try {
        this.session = await ort.InferenceSession.create('/models/healthModel.onnx');
        console.log("✅ Offline AI Model loaded successfully");
      } catch (e) {
        console.error("❌ Failed to load AI model:", e);
      }
    }
  }

  static async predict(data: {
    age: number;
    gender: number;
    smoking: number;
    alcohol: number;
    fruit_veg: number;
    activity: number;
    bmi: number;
    sys_bp: number;
  }) {
    if (!this.session) await this.init();
    if (!this.session) return null;

    const inputData = Float32Array.from([
      data.age,
      data.gender,
      data.smoking,
      data.alcohol,
      data.fruit_veg,
      data.activity,
      data.bmi,
      data.sys_bp
    ]);

    const tensor = new ort.Tensor('float32', inputData, [1, 8]);
    
    try {
      const feeds: Record<string, ort.Tensor> = { float_input: tensor };
      const results = await this.session.run(feeds);
      
      const riskLevel = results.output_label.data[0]; 
      
      return {
        level: riskLevel,
        probability: results.output_probability.data as Float32Array
      };
    } catch (e) {
      console.error("Inference Error:", e);
      return null;
    }
  }

  static getSpecialtyMapping(prediction: any, data: any) {
    if (prediction.level === 2) {
      if (data.sys_bp >= 140) return "Зүрх судас";
      if (data.bmi >= 25) return "Дотоод шүүрэл";
      if (data.smoking === 1) return "Уушги, амьсгалын зам";
      if (data.alcohol === 1) return "Сэтгэцийн эрүүл мэнд";
    }
    return undefined;
  }
}
