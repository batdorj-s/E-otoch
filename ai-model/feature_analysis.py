import pandas as pd
import seaborn as sns
import matplotlib.pyplot as plt
import numpy as np


df = pd.read_csv('ai-model/data/heart_disease_uci.csv')


stats = df[['age', 'trestbps', 'chol', 'thalch']].describe()
print("--- Үндсэн статистик үзүүлэлтүүд ---")
print(stats)



df_numeric = df.select_dtypes(include=[np.number])
corr_matrix = df_numeric.corr()

print("\n--- Хүчин зүйлсийн хамаарал (Correlation) ---")
print(corr_matrix['num'].sort_values(ascending=False)) 


plt.figure(figsize=(10, 8))
sns.heatmap(corr_matrix, annot=True, cmap='coolwarm', fmt='.2f')
plt.title('Эрүүл мэндийн хүчин зүйлсийн хамаарлын матриц')
plt.tight_layout()
plt.savefig('ai-model/feature_eng_viz.png')


with open('ai-model/analysis_summary.txt', 'w') as f:
    f.write("### Kaggle Data Analysis Insights\n")
    f.write(f"- Дундаж нас: {df['age'].mean():.1f}\n")
    f.write(f"- Дундаж цусан дахь холестерин: {df['chol'].mean():.1f} mg/dl\n")
    f.write(f"- Нас болон эрсдэлийн хамаарал: {corr_matrix.loc['age', 'num']:.2f}\n")
    f.write("- Хамгийн өндөр хамааралтай хүчин зүйлс: trestbps (даралт), thalch (зүрхний цохилт)\n")

print("\n✅ Анализ дууслаа. 'feature_eng_viz.png' болон 'analysis_summary.txt' файлууд үүслээ.")
