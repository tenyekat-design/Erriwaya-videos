// voiceover.mp3 = the two takes edited sentence by sentence (sentence starts in the edit, from Whisper):
//   0.00 اليوم تبدأ | 4.09 انطلق رسمياً | 8.93 منصة صممت | 14.21 على موقعنا الجديد | 18.48 والأخبار العاجلة
//   21.13 وتقاريرنا المصورة | 25.38 بوابات خاصة | 30.73 لتصل إلى | 34.31 تصميم عصري | 36.95 على هاتفك
//   41.55 شبكة الرواية | 45.19 وموعد دائم | 48.04 زوروا موقعنا الآن (ends 50.9)
// The voice starts at voStart; lines are those starts in video time; scenes cut just before their sentence.
(() => {
  const voStart = 1.4;
  const lines = [0, 4.09, 8.93, 14.21, 18.48, 21.13, 25.38, 30.73, 34.31, 36.95, 41.55, 45.19, 48.04].map(s => +(s + voStart).toFixed(2));
  const cut = k => +(lines[k] - .15).toFixed(2);
  window.PROMO_TIMING = { voStart, lines, scenes: [0, cut(1), cut(4), cut(5), cut(6), cut(8), cut(10), cut(12)], duration: 55 };
})();
