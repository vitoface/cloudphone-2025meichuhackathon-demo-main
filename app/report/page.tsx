'use client';

import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { useGeolocation } from '@/component/useGeolocation';

// ==========================================
// 🌐 多國語言字典 (i18n Translations)
// ==========================================
const translations = {
  'zh': {
    pageTitle: '狀況回報選單',
    titleCrash: '發生車禍', titleJam: '嚴重塞車', titleWork: '道路施工', titleDanger: '不明危險', titleDisaster: '自然災害',
    defaultStatus: '請使用上下鍵選擇，按 Enter 回報',
    cooldownStatus: (sec: number) => `⏳ 冷卻中... 請等待 ${sec} 秒`,
    sendingStatus: '定位並傳送中，請稍候...',
    offlineStatus: '📦 離線狀態：回報已暫存，恢復連線時同步！',
    noCoordsError: '無法取得座標',
    reportDesc: '透過實體按鍵手機回報',
    successStatus: (title: string) => `回報成功！已記錄：${title}`,
    failStatus: (err: string) => `回報失敗: ${err}`,
    serverError: '伺服器錯誤',
    networkError: '網路或定位失敗，已為您本機暫存。',
    gpsLocating: 'GPS 定位中...',
    move: '移動', send: '送出', cancelBack: '取消返回'
  },
  'en': {
    pageTitle: 'Report Menu',
    titleCrash: 'Car Crash', titleJam: 'Traffic Jam', titleWork: 'Roadwork', titleDanger: 'Unknown Danger', titleDisaster: 'Natural Disaster',
    defaultStatus: 'Use Up/Down to select, Enter to report',
    cooldownStatus: (sec: number) => `⏳ Cooldown... wait ${sec}s`,
    sendingStatus: 'Locating and sending...',
    offlineStatus: '📦 Offline: Report saved locally, will sync later!',
    noCoordsError: 'Unable to get coordinates',
    reportDesc: 'Reported via physical keypad phone',
    successStatus: (title: string) => `Success! Recorded: ${title}`,
    failStatus: (err: string) => `Failed: ${err}`,
    serverError: 'Server error',
    networkError: 'Network/GPS failed, saved locally.',
    gpsLocating: 'Locating GPS...',
    move: 'Move', send: 'Send', cancelBack: 'Cancel & Back'
  },
  'ar': {
    pageTitle: 'قائمة الإبلاغ',
    titleCrash: 'حادث سير', titleJam: 'ازدحام شديد', titleWork: 'أعمال طرق', titleDanger: 'خطر مجهول', titleDisaster: 'كارثة طبيعية',
    defaultStatus: 'استخدم أعلى/أسفل للتحديد، و Enter للإبلاغ',
    cooldownStatus: (sec: number) => `⏳ تبريد... انتظر ${sec} ثانية`,
    sendingStatus: 'جاري التحديد والإرسال...',
    offlineStatus: '📦 وضع عدم الاتصال: تم الحفظ، ستتم المزامنة لاحقاً!',
    noCoordsError: 'تعذر الحصول على الإحداثيات',
    reportDesc: 'تم الإبلاغ عبر هاتف بلوحة مفاتيح',
    successStatus: (title: string) => `نجاح! تم تسجيل: ${title}`,
    failStatus: (err: string) => `فشل: ${err}`,
    serverError: 'خطأ في الخادم',
    networkError: 'فشل الشبكة/الموقع، تم الحفظ محلياً.',
    gpsLocating: 'جاري تحديد GPS...',
    move: 'تحريك', send: 'إرسال', cancelBack: 'إلغاء ورجوع'
  },
  'fr': {
    pageTitle: 'Menu de signalement',
    titleCrash: 'Accident', titleJam: 'Gros bouchon', titleWork: 'Travaux', titleDanger: 'Danger inconnu', titleDisaster: 'Catastrophe',
    defaultStatus: 'Haut/Bas pour choisir, Entrée pour signaler',
    cooldownStatus: (sec: number) => `⏳ Attente... patientez ${sec}s`,
    sendingStatus: 'Localisation et envoi...',
    offlineStatus: '📦 Hors ligne : Enregistré localement, sera synchronisé !',
    noCoordsError: 'Coordonnées introuvables',
    reportDesc: 'Signalé via téléphone à clavier',
    successStatus: (title: string) => `Succès ! Enregistré : ${title}`,
    failStatus: (err: string) => `Échec : ${err}`,
    serverError: 'Erreur serveur',
    networkError: 'Échec réseau/GPS, sauvegardé localement.',
    gpsLocating: 'Localisation GPS...',
    move: 'Déplacer', send: 'Envoyer', cancelBack: 'Annuler & Retour'
  },
  'pt': {
    pageTitle: 'Menu de Relatos',
    titleCrash: 'Acidente', titleJam: 'Congestionamento', titleWork: 'Obras', titleDanger: 'Perigo desconhecido', titleDisaster: 'Desastre natural',
    defaultStatus: 'Cima/Baixo para selecionar, Enter para relatar',
    cooldownStatus: (sec: number) => `⏳ Tempo de espera... ${sec}s`,
    sendingStatus: 'Localizando e enviando...',
    offlineStatus: '📦 Offline: Salvo localmente, será sincronizado!',
    noCoordsError: 'Não foi possível obter coordenadas',
    reportDesc: 'Relatado via telefone de teclado',
    successStatus: (title: string) => `Sucesso! Registrado: ${title}`,
    failStatus: (err: string) => `Falha: ${err}`,
    serverError: 'Erro no servidor',
    networkError: 'Falha de rede/GPS, salvo localmente.',
    gpsLocating: 'Localizando GPS...',
    move: 'Mover', send: 'Enviar', cancelBack: 'Cancelar e Voltar'
  },
  'vi': {
    pageTitle: 'Menu Báo cáo',
    titleCrash: 'Tai nạn', titleJam: 'Tắc đường', titleWork: 'Công trường', titleDanger: 'Nguy hiểm', titleDisaster: 'Thiên tai',
    defaultStatus: 'Dùng Lên/Xuống để chọn, Enter để báo cáo',
    cooldownStatus: (sec: number) => `⏳ Đang chờ... đợi ${sec}s`,
    sendingStatus: 'Đang định vị và gửi...',
    offlineStatus: '📦 Ngoại tuyến: Đã lưu cục bộ, sẽ đồng bộ sau!',
    noCoordsError: 'Không thể lấy tọa độ',
    reportDesc: 'Báo cáo qua điện thoại phím cứng',
    successStatus: (title: string) => `Thành công! Đã lưu: ${title}`,
    failStatus: (err: string) => `Lỗi: ${err}`,
    serverError: 'Lỗi máy chủ',
    networkError: 'Lỗi mạng/GPS, đã lưu trên máy.',
    gpsLocating: 'Đang định vị GPS...',
    move: 'Di chuyển', send: 'Gửi', cancelBack: 'Hủy & Quay lại'
  },
  'ha': {
    pageTitle: 'Menu na Rahoto',
    titleCrash: 'Hatsarin mota', titleJam: 'Cunkoson ababen hawa', titleWork: 'Aikin hanya', titleDanger: 'Hadari', titleDisaster: 'Bala\'i',
    defaultStatus: 'Yi amfani da Sama/Ƙasa, danna Enter',
    cooldownStatus: (sec: number) => `⏳ Jira kadan... sakan ${sec}`,
    sendingStatus: 'Nemo wuri da aikawa...',
    offlineStatus: '📦 Ba intanet: An adana a waya, za a aika daga baya!',
    noCoordsError: 'Ba a iya samun wuri ba',
    reportDesc: 'An kawo rahoto ta wayar maballin',
    successStatus: (title: string) => `Yayi! An yi rikodin: ${title}`,
    failStatus: (err: string) => `Ya gaza: ${err}`,
    serverError: 'Matsalar sabar',
    networkError: 'Matsalar intanet/GPS, an adana.',
    gpsLocating: 'Nemo GPS...',
    move: 'Matsa', send: 'Aika', cancelBack: 'Soke & Koma'
  },
  'sw': {
    pageTitle: 'Menyu ya Ripoti',
    titleCrash: 'Ajali', titleJam: 'Msongamano', titleWork: 'Ujenzi wa barabara', titleDanger: 'Hatari', titleDisaster: 'Janga',
    defaultStatus: 'Tumia Juu/Chini kuchagua, Enter kuripoti',
    cooldownStatus: (sec: number) => `⏳ Tulia... subiri sekunde ${sec}`,
    sendingStatus: 'Inatafuta na kutuma...',
    offlineStatus: '📦 Nje ya mtandao: Imehifadhiwa, itasawazishwa baadaye!',
    noCoordsError: 'Imeshindwa kupata kuratibu',
    reportDesc: 'Imeripotiwa kupitia simu ya vitufe',
    successStatus: (title: string) => `Imefanikiwa! Imerekodiwa: ${title}`,
    failStatus: (err: string) => `Imeshindwa: ${err}`,
    serverError: 'Hitilafu ya seva',
    networkError: 'Mtandao/GPS imeshindwa, imehifadhiwa.',
    gpsLocating: 'Inatafuta GPS...',
    move: 'Sogeza', send: 'Tuma', cancelBack: 'Ghairi & Rudi'
  }
};

export default function ReportPage() {
  const router = useRouter();
  const { fetchLocation, loading, errorMsg } = useGeolocation({ autoFetch: false });

<<<<<<< HEAD
  // 🌐 語言狀態管理
  const [langCode, setLangCode] = useState<string>('en');

=======
  const [langCode, setLangCode] = useState<string>('zh');
>>>>>>> 1f7fb8f5115203d29fc34efd1fca50eec3016b03
  const [selectedIndex, setSelectedIndex] = useState<number>(0);
  const [isReporting, setIsReporting] = useState(false);
  
  const [status, setStatus] = useState<{
    type: 'default' | 'cooldown' | 'sending' | 'offline_saved' | 'success' | 'fail' | 'network_error';
    payload?: string | number;
  }>({ type: 'default' });

  const itemRefs = useRef<(HTMLDivElement | null)[]>([]);

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const navLang = navigator.language.split('-')[0].toLowerCase();
      if (navigator.language.toLowerCase().startsWith('zh')) {
        setLangCode('zh');
      } else if (translations[navLang as keyof typeof translations]) {
        setLangCode(navLang);
      } else {
        setLangCode('en');
      }
    }
  }, []);

  const t = translations[langCode as keyof typeof translations] || translations['en'];

  const getReportOptions = () => [
    { title: t.titleCrash, event: 'car_crash' },
    { title: t.titleJam, event: 'traffic_jam' },
    { title: t.titleWork, event: 'roadwork' },
    { title: t.titleDanger, event: 'unknown_danger' },
    { title: t.titleDisaster, event: 'natural_disaster' },
  ];
  const currentOptions = getReportOptions();

  let displayMessage = t.defaultStatus;
  if (status.type === 'cooldown') displayMessage = t.cooldownStatus(status.payload as number);
  else if (status.type === 'sending') displayMessage = t.sendingStatus;
  else if (status.type === 'offline_saved') displayMessage = t.offlineStatus;
  else if (status.type === 'success') displayMessage = t.successStatus(status.payload as string);
  else if (status.type === 'fail') {
    const errText = status.payload === 'serverError' ? t.serverError : (status.payload as string);
    displayMessage = t.failStatus(errText);
  }
  else if (status.type === 'network_error') displayMessage = t.networkError;

  useEffect(() => {
    if (itemRefs.current[selectedIndex]) {
      itemRefs.current[selectedIndex]?.scrollIntoView({
        behavior: 'smooth',
        block: 'nearest', 
      });
    }
  }, [selectedIndex]);

  // 🌟 輔助函式：可靠地寫入離線暫存
  const saveToOfflineQueue = (payload: any) => {
    try {
      const raw = localStorage.getItem('offline_reports');
      const queue = raw ? JSON.parse(raw) : [];
      queue.push(payload);
      localStorage.setItem('offline_reports', JSON.stringify(queue));
      localStorage.setItem('my_last_report_time', Date.now().toString());
    } catch (e) {
      console.error('寫入 offline_reports 失敗:', e);
    }
  };

  // 處理送出回報的邏輯
  const handleReport = async (option: { title: string, event: string }) => {
    if (isReporting || loading) return;

    // 30 秒回報冷卻機制
    const COOLDOWN_SECONDS = 30;
    const lastReportStr = localStorage.getItem('my_last_report_time');
    
    if (lastReportStr) {
      const elapsedMs = Date.now() - parseInt(lastReportStr, 10);
      const elapsedSecs = Math.floor(elapsedMs / 1000);

      if (elapsedSecs < COOLDOWN_SECONDS) {
        const remainingSecs = COOLDOWN_SECONDS - elapsedSecs;
        setStatus({ type: 'cooldown', payload: remainingSecs });
        setTimeout(() => setStatus({ type: 'default' }), 3000);
        return;
      }
    }

    setIsReporting(true);
    setStatus({ type: 'sending' });

    // 優先取得座標：先向 GPS 請求，失敗則依序向 sessionStorage 與預設值 fallback
    let lat = 24.7936;
    let lng = 120.9917;

    try {
      const currentCoords = await fetchLocation();
      if (currentCoords && currentCoords.lat && currentCoords.lng) {
        lat = currentCoords.lat;
        lng = currentCoords.lng;
      }
    } catch {
      const savedLat = sessionStorage.getItem('map_last_lat');
      const savedLng = sessionStorage.getItem('map_last_lng');
      if (savedLat && savedLng) {
        lat = parseFloat(savedLat);
        lng = parseFloat(savedLng);
      }
    }

    // 🌟 統一 Payload 格式（注意 longtitude 的拼字需與後端完全一致）
    const reportPayload = {
      longtitude: lng,
      latitude: lat,
      title: option.title,
      description: t.reportDesc,
      events: option.event,
      created_at: new Date().toISOString(),
    };

    // 🌟 情況 A：當前處於無網路狀態（或 navigator.onLine 為 false）
    if (typeof window !== 'undefined' && !navigator.onLine) {
      saveToOfflineQueue(reportPayload);
      setStatus({ type: 'offline_saved' });
      setTimeout(() => {
        router.push('/');
      }, 1500);
      return;
    }

    // 🌟 情況 B：連線正常，直接打 API
    try {
      const response = await fetch('/api/newMapinfo', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(reportPayload),
      });

      const result = await response.json();

      if (response.ok && result.success) {
        localStorage.setItem('my_last_report_time', Date.now().toString());
        setStatus({ type: 'success', payload: option.title });
        setTimeout(() => {
          router.push('/');
        }, 1500);
      } else {
        // 如果後端回報錯誤，存入本機備援
        saveToOfflineQueue(reportPayload);
        setStatus({ type: 'offline_saved' });
        setTimeout(() => {
          router.push('/');
        }, 1500);
      }
    } catch (error) {
      // 🌟 情況 C：API 請求途中連線中斷（Failed to fetch），自動轉入離線暫存
      console.warn('API 呼叫失敗，自動轉入離線佇列:', error);
      saveToOfflineQueue(reportPayload);
      setStatus({ type: 'offline_saved' });
      setTimeout(() => {
        router.push('/');
      }, 1500);
    }
  };

  const handleCancel = () => {
    router.push('/');
  };

  // 監聽實體按鍵
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (isReporting || loading) return;

      switch (event.key) {
        case 'ArrowUp':
        case '2':
          event.preventDefault();
          setSelectedIndex((prev) => (prev > 0 ? prev - 1 : currentOptions.length - 1));
          break;
        case 'ArrowDown':
        case '5':
          event.preventDefault();
          setSelectedIndex((prev) => (prev < currentOptions.length - 1 ? prev + 1 : 0));
          break;
        case 'Enter':
          event.preventDefault();
          handleReport(currentOptions[selectedIndex]);
          break;
        case '0':
          event.preventDefault();
          handleCancel();
          break;
        default:
          break;
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [selectedIndex, isReporting, loading, router, currentOptions]);

  return (
    <main
      dir={langCode === 'ar' ? 'rtl' : 'ltr'}
      style={{
        width: '100%',
        maxWidth: '240px',
        height: '100vh',
        maxHeight: '320px',
        margin: '0 auto',
        overflow: 'hidden',
        boxSizing: 'border-box',
        padding: '6px',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        backgroundColor: '#ffffff',
        fontFamily: 'sans-serif',
      }}
    >
      <div style={{ flexShrink: 0, textAlign: 'center', width: '100%' }}>
        <h2 style={{ fontSize: '14px', fontWeight: 'bold', marginBottom: '2px', color: '#000000' }}>
          {t.pageTitle}
        </h2>
        <div style={{ 
          fontSize: '11px', 
          color: (isReporting || loading || status.type === 'cooldown' || status.type === 'offline_saved') ? '#2563eb' : '#dc2626', 
          marginBottom: '6px', 
          fontWeight: 'bold' 
        }}>
          {loading ? t.gpsLocating : displayMessage}
        </div>
      </div>

      <div
        style={{
          width: '210px',
          flex: 1,
          overflowY: 'scroll',
          scrollbarWidth: 'none',
          msOverflowStyle: 'none',
          border: '1px solid #d1d5db',
          borderRadius: '4px',
          backgroundColor: '#f9fafb',
          padding: '4px',
          boxSizing: 'border-box',
          display: 'flex',
          flexDirection: 'column',
          gap: '4px',
        }}
      >
        {currentOptions.map((opt, index) => {
          const isSelected = index === selectedIndex;
          return (
            <div
              key={opt.event}
              ref={(el) => { itemRefs.current[index] = el; }}
              onClick={() => {
                setSelectedIndex(index);
                handleReport(opt);
              }}
              style={{
                padding: '6px 8px',
                backgroundColor: isSelected ? '#000000' : '#ffffff',
                color: isSelected ? '#ffffff' : '#000000',
                border: isSelected ? '2px solid #2563eb' : '1px solid #e5e7eb',
                borderRadius: '4px',
                textAlign: 'left',
                display: 'flex',
                alignItems: 'center',
                cursor: 'pointer',
                fontSize: '12px',
                fontWeight: 'bold',
                flexShrink: 0,
                boxSizing: 'border-box',
              }}
            >
              <span style={{ 
                marginRight: langCode === 'ar' ? '0' : '8px', 
                marginLeft: langCode === 'ar' ? '8px' : '0', 
                opacity: 0.7 
              }}>
                [{index + 1}]
              </span>
              <span>{opt.title}</span>
            </div>
          );
        })}
      </div>

      <div style={{ flexShrink: 0, width: '210px', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
        <div style={{ fontSize: '10px', color: '#4b5563', marginTop: '6px', marginBottom: '4px', lineHeight: '1.3', textAlign: 'center' }}>
          <span><strong>[↑/2] [↓/5]</strong> {t.move} | <strong>[Enter]</strong> {t.send}</span>
        </div>

        <div
          onClick={handleCancel}
          style={{
            cursor: 'pointer',
            width: '100%',
            boxSizing: 'border-box',
            padding: '4px 8px',
            backgroundColor: '#fee2e2',
            border: '1px solid #f87171',
            borderRadius: '4px',
            textAlign: 'left',
            display: 'flex',
            alignItems: 'center',
          }}
        >
          <span style={{ 
            fontSize: '11px', 
            fontWeight: 'bold', 
            backgroundColor: '#dc2626', 
            color: '#ffffff', 
            padding: '1px 5px', 
            borderRadius: '3px', 
            marginRight: langCode === 'ar' ? '0' : '8px',
            marginLeft: langCode === 'ar' ? '8px' : '0'
          }}>
            [ 0 ]
          </span>
          <span style={{ fontSize: '12px', color: '#991b1b', fontWeight: 'bold' }}>
            {t.cancelBack}
          </span>
        </div>
      </div>
    </main>
  );
}