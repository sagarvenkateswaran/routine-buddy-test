// Busy-parent + multi-child strings. Order = UX2K.
const UX2K=['quick','schoolM','behind','minsLeft','doneBy','kids','addKid'];
const UX2T={
en:["⚡ School morning – start now","School morning","We're running a bit behind. Let's keep moving!","{m} minutes left until it's time to go.","Out the door by (optional)","Children","Add child"],
es:["⚡ Mañana de cole – empezar ya","Mañana de cole","Vamos un poco tarde. ¡Sigamos!","Quedan {m} minutos para salir.","Salir de casa a las (opcional)","Niños","Añadir niño"],
fr:["⚡ Matin d'école – commencer","Matin d'école","On a un peu de retard. Continuons !","Plus que {m} minutes avant de partir.","Départ à (facultatif)","Enfants","Ajouter un enfant"],
de:["⚡ Schulmorgen – jetzt starten","Schulmorgen","Wir sind etwas spät dran. Weiter geht's!","Noch {m} Minuten, bis es losgeht.","Aus dem Haus um (optional)","Kinder","Kind hinzufügen"],
pt:["⚡ Manhã de escola – começar já","Manhã de escola","Estamos um pouco atrasados. Vamos continuar!","Faltam {m} minutos para sair.","Sair de casa às (opcional)","Crianças","Adicionar criança"],
it:["⚡ Mattina di scuola – inizia ora","Mattina di scuola","Siamo un po' in ritardo. Andiamo avanti!","Mancano {m} minuti all'uscita.","Uscire alle (facoltativo)","Bambini","Aggiungi bambino"],
hi:["⚡ स्कूल की सुबह – अभी शुरू करें","स्कूल की सुबह","हम थोड़ा पीछे हैं। चलो, आगे बढ़ते रहें!","निकलने में {m} मिनट बाकी हैं।","घर से निकलने का समय (वैकल्पिक)","बच्चे","बच्चा जोड़ें"],
ta:["⚡ பள்ளிக் காலை – இப்போதே தொடங்கு","பள்ளிக் காலை","கொஞ்சம் தாமதமாகிறது. தொடர்ந்து செல்வோம்!","கிளம்ப இன்னும் {m} நிமிடங்கள்.","வீட்டை விட்டுக் கிளம்பும் நேரம் (விருப்பம்)","குழந்தைகள்","குழந்தையைச் சேர்"],
te:["⚡ స్కూల్ ఉదయం – ఇప్పుడే మొదలుపెట్టు","స్కూల్ ఉదయం","కొంచెం ఆలస్యమవుతోంది. ముందుకు సాగుదాం!","బయలుదేరడానికి {m} నిమిషాలు ఉన్నాయి.","ఇంటి నుండి బయలుదేరే సమయం (ఐచ్ఛికం)","పిల్లలు","పిల్లను జోడించు"],
kn:["⚡ ಶಾಲೆಯ ಬೆಳಿಗ್ಗೆ – ಈಗಲೇ ಶುರು","ಶಾಲೆಯ ಬೆಳಿಗ್ಗೆ","ಸ್ವಲ್ಪ ತಡವಾಗುತ್ತಿದೆ. ಮುಂದುವರಿಯೋಣ!","ಹೊರಡಲು {m} ನಿಮಿಷ ಉಳಿದಿದೆ.","ಮನೆಯಿಂದ ಹೊರಡುವ ಸಮಯ (ಐಚ್ಛಿಕ)","ಮಕ್ಕಳು","ಮಗು ಸೇರಿಸು"],
ml:["⚡ സ്കൂൾ രാവിലെ – ഇപ്പോൾ തുടങ്ങൂ","സ്കൂൾ രാവിലെ","കുറച്ച് വൈകുന്നു. നമുക്ക് തുടരാം!","പോകാൻ {m} മിനിറ്റ് ബാക്കി.","വീട്ടിൽ നിന്ന് ഇറങ്ങുന്ന സമയം (ഓപ്ഷണൽ)","കുട്ടികൾ","കുട്ടിയെ ചേർക്കൂ"],
zh:["⚡ 上学早晨 – 马上开始","上学早晨","我们有点晚了，继续加油！","离出门还有 {m} 分钟。","出门时间（可选）","孩子","添加孩子"],
ja:["⚡ 登校の朝 – すぐスタート","登校の朝","ちょっと遅れ気味。どんどん進もう！","出発まであと {m} 分。","家を出る時刻（任意）","子ども","子どもを追加"],
ko:["⚡ 등교 아침 – 바로 시작","등교 아침","조금 늦어지고 있어. 계속 가 보자!","나갈 때까지 {m}분 남았어.","집에서 나가는 시간 (선택)","아이들","아이 추가"],
ar:["⚡ صباح المدرسة – ابدأ الآن","صباح المدرسة","تأخرنا قليلا. لنواصل!","بقي {m} دقيقة على وقت الخروج.","الخروج من البيت الساعة (اختياري)","الأطفال","إضافة طفل"],
ru:["⚡ Школьное утро – начать сейчас","Школьное утро","Мы немного отстаём. Продолжаем!","До выхода осталось {m} мин.","Выйти из дома в (необязательно)","Дети","Добавить ребёнка"]};
for(const l in UX2T)UX2K.forEach((k,n)=>I18N[l][k]=UX2T[l][n]);
// Temperature setting: [label, auto]
const TEMPT={en:["Temperature","Auto (where you are)"],es:["Temperatura","Automática (según tu ubicación)"],fr:["Température","Auto (selon le lieu)"],de:["Temperatur","Automatisch (nach Standort)"],
pt:["Temperatura","Automática (pelo local)"],it:["Temperatura","Automatica (in base al luogo)"],hi:["तापमान","अपने आप (आप जहाँ हैं)"],ta:["வெப்பநிலை","தானியங்கி (இருக்குமிடம்)"],te:["ఉష్ణోగ్రత","ఆటోమేటిక్ (మీరున్న చోటు)"],
kn:["ತಾಪಮಾನ","ಸ್ವಯಂ (ನೀವಿರುವ ಸ್ಥಳ)"],ml:["താപനില","സ്വയം (നിങ്ങളുള്ള സ്ഥലം)"],zh:["温度","自动（按所在地）"],ja:["気温の単位","自動（現在地）"],ko:["온도","자동 (현재 위치)"],ar:["درجة الحرارة","تلقائي (حسب موقعك)"],ru:["Температура","Авто (по местоположению)"]};
for(const l in TEMPT){I18N[l].tempSet=TEMPT[l][0];I18N[l].tAuto=TEMPT[l][1]}
