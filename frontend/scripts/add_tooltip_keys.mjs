// Adds the new tooltip keys to all 47 non-English locale files.
// Uses native translations for major languages and English fallback for the rest.
import fs from 'node:fs';
import path from 'node:path';

const I18N_DIR = path.resolve('src/i18n');

// Per-locale translations. Anything missing falls back to English.
const TRANSLATIONS = {
  hi: {
    'tooltip.test_crash': 'टेस्ट क्रैश अलर्ट',
    'tooltip.manual_location': 'मैन्युअल रूप से सेट किया गया स्थान उपयोग में',
    'tooltip.backend_warming': 'सर्वर जग रहा है — निष्क्रियता के बाद पहले अनुरोध में 30–55 सेकंड लग सकते हैं',
    'tooltip.backend_fallback': 'सर्वर ने लाइव डेटा नहीं लौटाया — पुनः प्रयास करते हुए संग्रहीत निर्देशिका दिखा रहे हैं',
    'tooltip.copy_gps': 'GPS कॉपी करें',
    'tooltip.send_immediate_sos': 'तुरंत SOS भेजें',
    'common.close': 'बंद करें',
    'common.back': 'वापस',
  },
  ta: {
    'tooltip.test_crash': 'சோதனை விபத்து எச்சரிக்கை',
    'tooltip.manual_location': 'கைமுறையாக அமைக்கப்பட்ட இடம் பயன்பாட்டில்',
    'tooltip.backend_warming': 'சேவையகம் எழுந்துகொண்டிருக்கிறது — செயலற்ற நிலைக்குப் பிறகு முதல் கோரிக்கை 30–55வி எடுக்கலாம்',
    'tooltip.backend_fallback': 'சேவையகம் நேரடி தரவை வழங்கவில்லை — மீண்டும் முயற்சிக்கும்போது சேமித்த அடைவைக் காட்டுகிறோம்',
    'tooltip.copy_gps': 'GPS நகலெடு',
    'tooltip.send_immediate_sos': 'உடனடி SOS அனுப்பு',
    'common.close': 'மூடு',
    'common.back': 'திரும்பு',
  },
  te: {
    'tooltip.test_crash': 'పరీక్ష ప్రమాద హెచ్చరిక',
    'tooltip.manual_location': 'మాన్యువల్‌గా సెట్ చేసిన స్థానం ఉపయోగంలో ఉంది',
    'tooltip.backend_warming': 'సర్వర్ మేల్కొంటోంది — నిష్క్రియ తర్వాత మొదటి అభ్యర్థన 30–55 సెకన్లు పట్టవచ్చు',
    'tooltip.backend_fallback': 'సర్వర్ లైవ్ డేటాను తిరిగి ఇవ్వలేదు — మళ్లీ ప్రయత్నిస్తున్నప్పుడు నిల్వ చేసిన డైరెక్టరీని చూపిస్తున్నాము',
    'tooltip.copy_gps': 'GPS కాపీ చేయి',
    'tooltip.send_immediate_sos': 'తక్షణ SOS పంపండి',
    'common.close': 'మూసివేయి',
    'common.back': 'వెనుకకు',
  },
  bn: {
    'tooltip.test_crash': 'পরীক্ষা ক্র্যাশ সতর্কতা',
    'tooltip.manual_location': 'ম্যানুয়ালি সেট করা অবস্থান ব্যবহৃত হচ্ছে',
    'tooltip.backend_warming': 'সার্ভার জাগছে — নিষ্ক্রিয়তার পরে প্রথম অনুরোধে ৩০–৫৫ সেকেন্ড লাগতে পারে',
    'tooltip.backend_fallback': 'সার্ভার লাইভ ডেটা ফেরত দেয়নি — পুনঃচেষ্টা করার সময় সংরক্ষিত ডিরেক্টরি দেখাচ্ছি',
    'tooltip.copy_gps': 'GPS কপি করুন',
    'tooltip.send_immediate_sos': 'এখনই SOS পাঠান',
    'common.close': 'বন্ধ',
    'common.back': 'ফিরে যান',
  },
  mr: {
    'tooltip.test_crash': 'चाचणी क्रॅश सूचना',
    'tooltip.manual_location': 'मॅन्युअली सेट केलेले स्थान वापरात आहे',
    'tooltip.backend_warming': 'सर्व्हर जागत आहे — निष्क्रियतेनंतर पहिल्या विनंतीला 30–55 सेकंद लागू शकतात',
    'tooltip.backend_fallback': 'सर्व्हरने थेट डेटा परत केला नाही — पुन्हा प्रयत्न करताना संचयित निर्देशिका दाखवत आहोत',
    'tooltip.copy_gps': 'GPS कॉपी करा',
    'tooltip.send_immediate_sos': 'त्वरित SOS पाठवा',
    'common.close': 'बंद करा',
    'common.back': 'मागे',
  },
  gu: {
    'tooltip.test_crash': 'ટેસ્ટ ક્રેશ ચેતવણી',
    'tooltip.manual_location': 'મેન્યુઅલી સેટ કરેલ સ્થાન ઉપયોગમાં છે',
    'tooltip.backend_warming': 'સર્વર જાગી રહ્યું છે — નિષ્ક્રિયતા પછી પ્રથમ વિનંતી 30–55 સેકન્ડ લઈ શકે છે',
    'tooltip.backend_fallback': 'સર્વરે લાઇવ ડેટા પાછો આપ્યો નથી — ફરી પ્રયાસ કરતી વખતે સંગ્રહિત ડિરેક્ટરી બતાવી રહ્યા છીએ',
    'tooltip.copy_gps': 'GPS કૉપિ કરો',
    'tooltip.send_immediate_sos': 'તાત્કાલિક SOS મોકલો',
    'common.close': 'બંધ કરો',
    'common.back': 'પાછા',
  },
  kn: {
    'tooltip.test_crash': 'ಪರೀಕ್ಷಾ ಅಪಘಾತ ಎಚ್ಚರಿಕೆ',
    'tooltip.manual_location': 'ಕೈಯಿಂದ ಹೊಂದಿಸಿದ ಸ್ಥಳ ಬಳಕೆಯಲ್ಲಿದೆ',
    'tooltip.backend_warming': 'ಸರ್ವರ್ ಎಚ್ಚರಗೊಳ್ಳುತ್ತಿದೆ — ನಿಷ್ಕ್ರಿಯತೆಯ ನಂತರ ಮೊದಲ ವಿನಂತಿ 30–55 ಸೆಕೆಂಡುಗಳನ್ನು ತೆಗೆದುಕೊಳ್ಳಬಹುದು',
    'tooltip.backend_fallback': 'ಸರ್ವರ್ ಲೈವ್ ಡೇಟಾವನ್ನು ಹಿಂತಿರುಗಿಸಲಿಲ್ಲ — ಮರುಪ್ರಯತ್ನಿಸುವಾಗ ಸಂಗ್ರಹಿಸಿದ ಡೈರೆಕ್ಟರಿಯನ್ನು ತೋರಿಸುತ್ತಿದ್ದೇವೆ',
    'tooltip.copy_gps': 'GPS ನಕಲಿಸಿ',
    'tooltip.send_immediate_sos': 'ತಕ್ಷಣ SOS ಕಳುಹಿಸಿ',
    'common.close': 'ಮುಚ್ಚಿ',
    'common.back': 'ಹಿಂದೆ',
  },
  ml: {
    'tooltip.test_crash': 'പരീക്ഷണ അപകട മുന്നറിയിപ്പ്',
    'tooltip.manual_location': 'സ്വമേധയാ സജ്ജമാക്കിയ സ്ഥാനം ഉപയോഗത്തിലാണ്',
    'tooltip.backend_warming': 'സെർവർ ഉണരുന്നു — നിഷ്ക്രിയത്വത്തിന് ശേഷം ആദ്യത്തെ അഭ്യർത്ഥനയ്ക്ക് 30–55 സെക്കൻഡ് എടുത്തേക്കാം',
    'tooltip.backend_fallback': 'സെർവർ ലൈവ് ഡാറ്റ തിരികെ നൽകിയില്ല — വീണ്ടും ശ്രമിക്കുമ്പോൾ സംഭരിച്ച ഡയറക്ടറി കാണിക്കുന്നു',
    'tooltip.copy_gps': 'GPS പകർത്തുക',
    'tooltip.send_immediate_sos': 'ഉടനടി SOS അയയ്‌ക്കുക',
    'common.close': 'അടയ്ക്കുക',
    'common.back': 'തിരികെ',
  },
  pa: {
    'tooltip.test_crash': 'ਟੈਸਟ ਕਰੈਸ਼ ਚਿਤਾਵਨੀ',
    'tooltip.manual_location': 'ਹੱਥੀਂ ਸੈੱਟ ਕੀਤਾ ਸਥਾਨ ਵਰਤੋਂ ਵਿੱਚ ਹੈ',
    'tooltip.backend_warming': 'ਸਰਵਰ ਜਾਗ ਰਿਹਾ ਹੈ — ਨਿਸ਼ਕਿਰਿਆ ਤੋਂ ਬਾਅਦ ਪਹਿਲੀ ਬੇਨਤੀ 30–55 ਸੈਕਿੰਡ ਲੈ ਸਕਦੀ ਹੈ',
    'tooltip.backend_fallback': 'ਸਰਵਰ ਨੇ ਲਾਈਵ ਡਾਟਾ ਵਾਪਸ ਨਹੀਂ ਕੀਤਾ — ਮੁੜ ਕੋਸ਼ਿਸ਼ ਕਰਨ ਵੇਲੇ ਸਟੋਰ ਕੀਤੀ ਡਾਇਰੈਕਟਰੀ ਦਿਖਾ ਰਹੇ ਹਾਂ',
    'tooltip.copy_gps': 'GPS ਕਾਪੀ ਕਰੋ',
    'tooltip.send_immediate_sos': 'ਤੁਰੰਤ SOS ਭੇਜੋ',
    'common.close': 'ਬੰਦ ਕਰੋ',
    'common.back': 'ਵਾਪਸ',
  },
  ur: {
    'tooltip.test_crash': 'ٹیسٹ کریش الرٹ',
    'tooltip.manual_location': 'دستی طور پر سیٹ کردہ مقام استعمال میں',
    'tooltip.backend_warming': 'سرور جاگ رہا ہے — غیر فعالیت کے بعد پہلی درخواست 30–55 سیکنڈ لے سکتی ہے',
    'tooltip.backend_fallback': 'سرور نے براہ راست ڈیٹا واپس نہیں کیا — دوبارہ کوشش کرتے وقت محفوظ ڈائریکٹری دکھا رہے ہیں',
    'tooltip.copy_gps': 'GPS کاپی کریں',
    'tooltip.send_immediate_sos': 'فوری SOS بھیجیں',
    'common.close': 'بند کریں',
    'common.back': 'واپس',
  },
  ar: {
    'tooltip.test_crash': 'تنبيه اختبار حادث',
    'tooltip.manual_location': 'الموقع المحدد يدوياً قيد الاستخدام',
    'tooltip.backend_warming': 'الخادم يستيقظ — قد يستغرق الطلب الأول بعد الخمول 30–55 ثانية',
    'tooltip.backend_fallback': 'لم يُرجع الخادم بيانات حية — نعرض الدليل المخزن أثناء إعادة المحاولة',
    'tooltip.copy_gps': 'نسخ GPS',
    'tooltip.send_immediate_sos': 'إرسال SOS فوري',
    'common.close': 'إغلاق',
    'common.back': 'رجوع',
  },
  es: {
    'tooltip.test_crash': 'Alerta de prueba de accidente',
    'tooltip.manual_location': 'Ubicación establecida manualmente en uso',
    'tooltip.backend_warming': 'El servidor se está iniciando — la primera solicitud tras inactividad puede tardar 30–55 s',
    'tooltip.backend_fallback': 'El servidor no devolvió datos en vivo — mostrando directorio almacenado mientras reintentamos',
    'tooltip.copy_gps': 'Copiar GPS',
    'tooltip.send_immediate_sos': 'Enviar SOS inmediato',
    'common.close': 'Cerrar',
    'common.back': 'Atrás',
  },
  fr: {
    'tooltip.test_crash': 'Alerte de test d\'accident',
    'tooltip.manual_location': 'Position définie manuellement en cours d\'utilisation',
    'tooltip.backend_warming': 'Le serveur démarre — la première requête après inactivité peut prendre 30–55 s',
    'tooltip.backend_fallback': 'Le serveur n\'a pas renvoyé de données en direct — affichage du répertoire stocké pendant la nouvelle tentative',
    'tooltip.copy_gps': 'Copier GPS',
    'tooltip.send_immediate_sos': 'Envoyer SOS immédiat',
    'common.close': 'Fermer',
    'common.back': 'Retour',
  },
  de: {
    'tooltip.test_crash': 'Test-Crash-Warnung',
    'tooltip.manual_location': 'Manuell festgelegter Standort in Verwendung',
    'tooltip.backend_warming': 'Server startet — erste Anfrage nach Leerlauf kann 30–55 s dauern',
    'tooltip.backend_fallback': 'Server lieferte keine Live-Daten — Anzeige des gespeicherten Verzeichnisses während Wiederholung',
    'tooltip.copy_gps': 'GPS kopieren',
    'tooltip.send_immediate_sos': 'Sofortiges SOS senden',
    'common.close': 'Schließen',
    'common.back': 'Zurück',
  },
  pt: {
    'tooltip.test_crash': 'Alerta de teste de acidente',
    'tooltip.manual_location': 'Localização definida manualmente em uso',
    'tooltip.backend_warming': 'Servidor a iniciar — primeira solicitação após inatividade pode demorar 30–55 s',
    'tooltip.backend_fallback': 'Servidor não retornou dados ao vivo — mostrando diretório armazenado enquanto tentamos novamente',
    'tooltip.copy_gps': 'Copiar GPS',
    'tooltip.send_immediate_sos': 'Enviar SOS imediato',
    'common.close': 'Fechar',
    'common.back': 'Voltar',
  },
  ru: {
    'tooltip.test_crash': 'Тестовое оповещение об аварии',
    'tooltip.manual_location': 'Используется местоположение, заданное вручную',
    'tooltip.backend_warming': 'Сервер запускается — первый запрос после простоя может занять 30–55 с',
    'tooltip.backend_fallback': 'Сервер не вернул актуальные данные — показываем сохранённый каталог во время повтора',
    'tooltip.copy_gps': 'Копировать GPS',
    'tooltip.send_immediate_sos': 'Отправить SOS немедленно',
    'common.close': 'Закрыть',
    'common.back': 'Назад',
  },
  zh: {
    'tooltip.test_crash': '测试碰撞警报',
    'tooltip.manual_location': '正在使用手动设置的位置',
    'tooltip.backend_warming': '服务器正在启动 — 闲置后首次请求可能需要 30–55 秒',
    'tooltip.backend_fallback': '服务器未返回实时数据 — 重试时显示已存目录',
    'tooltip.copy_gps': '复制 GPS',
    'tooltip.send_immediate_sos': '立即发送 SOS',
    'common.close': '关闭',
    'common.back': '返回',
  },
  ja: {
    'tooltip.test_crash': 'テストクラッシュ警報',
    'tooltip.manual_location': '手動で設定した位置を使用中',
    'tooltip.backend_warming': 'サーバー起動中 — アイドル後の最初のリクエストは 30〜55 秒かかることがあります',
    'tooltip.backend_fallback': 'サーバーがライブデータを返しませんでした — 再試行中に保存されたディレクトリを表示しています',
    'tooltip.copy_gps': 'GPS をコピー',
    'tooltip.send_immediate_sos': '即時 SOS を送信',
    'common.close': '閉じる',
    'common.back': '戻る',
  },
};

const EN_FALLBACK = {
  'tooltip.test_crash': 'Test crash alert',
  'tooltip.manual_location': 'Using manually set location',
  'tooltip.backend_warming': 'Waking the backend up — first request after idle can take 30–55s',
  'tooltip.backend_fallback': 'Backend did not return live data — showing pre-loaded directory while we retry',
  'tooltip.copy_gps': 'Copy GPS',
  'tooltip.send_immediate_sos': 'Send immediate SOS',
  'common.close': 'Close',
  'common.back': 'Back',
};

const files = fs.readdirSync(I18N_DIR).filter((f) => f.endsWith('.json') && f !== 'en.json');

let touched = 0;
for (const file of files) {
  const code = path.basename(file, '.json');
  const filePath = path.join(I18N_DIR, file);
  const json = JSON.parse(fs.readFileSync(filePath, 'utf8'));
  const overrides = TRANSLATIONS[code] || {};

  let changed = false;
  for (const [key, en] of Object.entries(EN_FALLBACK)) {
    if (json[key] === undefined) {
      json[key] = overrides[key] || en;
      changed = true;
    }
  }
  if (changed) {
    fs.writeFileSync(filePath, JSON.stringify(json, null, 2) + '\n', 'utf8');
    touched++;
  }
}

console.log(`Updated ${touched}/${files.length} locale files`);
