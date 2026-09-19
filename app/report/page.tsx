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
    noCoordsError: '無法取得座標',
    reportDesc: '透過實體按鍵手機回報',
    successStatus: (title: string) => `回報成功！已記錄：${title}`,
    failStatus: (err: string) => `回報失敗: ${err}`,
    serverError: '伺服器錯誤',
    networkError: '網路或定位失敗，請稍後再試。',
    gpsLocating: 'GPS 定位中...',
    move: '移動', send: '送出', cancelBack: '取消返回'
  },
  'en': {
    pageTitle: 'Report Menu',
    titleCrash: 'Car Crash', titleJam: 'Traffic Jam', titleWork: 'Roadwork', titleDanger: 'Unknown Danger', titleDisaster: 'Natural Disaster',
    defaultStatus: 'Use Up/Down to select, Enter to report',
    cooldownStatus: (sec: number) => `⏳ Cooldown... wait ${sec}s`,
    sendingStatus: 'Locating and sending...',
    noCoordsError: 'Unable to get coordinates',
    reportDesc: 'Reported via physical keypad phone',
    successStatus: (title: string) => `Success! Recorded: ${title}`,
    failStatus: (err: string) => `Failed: ${err}`,
    serverError: 'Server error',
    networkError: 'Network/GPS failed, try again.',
    gpsLocating: 'Locating GPS...',
    move: 'Move', send: 'Send', cancelBack: 'Cancel & Back'
  },
  'ar': { // 阿拉伯文 (Arabic)
    pageTitle: 'قائمة الإبلاغ',
    titleCrash: 'حادث سير', titleJam: 'ازدحام شديد', titleWork: 'أعمال طرق', titleDanger: 'خطر مجهول', titleDisaster: 'كارثة طبيعية',
    defaultStatus: 'استخدم أعلى/أسفل للتحديد، و Enter للإبلاغ',
    cooldownStatus: (sec: number) => `⏳ تبريد... انتظر ${sec} ثانية`,
    sendingStatus: 'جاري التحديد والإرسال...',
    noCoordsError: 'تعذر الحصول على الإحداثيات',
    reportDesc: 'تم الإبلاغ عبر هاتف بلوحة مفاتيح',
    successStatus: (title: string) => `نجاح! تم تسجيل: ${title}`,
    failStatus: (err: string) => `فشل: ${err}`,
    serverError: 'خطأ في الخادم',
    networkError: 'فشل الشبكة/الموقع، أعد المحاولة.',
    gpsLocating: 'جاري تحديد GPS...',
    move: 'تحريك', send: 'إرسال', cancelBack: 'إلغاء ورجوع'
  },
  'fr': { // 法文 (French)
    pageTitle: 'Menu de signalement',
    titleCrash: 'Accident', titleJam: 'Gros bouchon', titleWork: 'Travaux', titleDanger: 'Danger inconnu', titleDisaster: 'Catastrophe',
    defaultStatus: 'Haut/Bas pour choisir, Entrée pour signaler',
    cooldownStatus: (sec: number) => `⏳ Attente... patientez ${sec}s`,
    sendingStatus: 'Localisation et envoi...',
    noCoordsError: 'Coordonnées introuvables',
    reportDesc: 'Signalé via téléphone à clavier',
    successStatus: (title: string) => `Succès ! Enregistré : ${title}`,
    failStatus: (err: string) => `Échec : ${err}`,
    serverError: 'Erreur serveur',
    networkError: 'Échec réseau/GPS, réessayez.',
    gpsLocating: 'Localisation GPS...',
    move: 'Déplacer', send: 'Envoyer', cancelBack: 'Annuler & Retour'
  },
  'pt': { // 葡萄牙文 (Portuguese)
    pageTitle: 'Menu de Relatos',
    titleCrash: 'Acidente', titleJam: 'Congestionamento', titleWork: 'Obras', titleDanger: 'Perigo desconhecido', titleDisaster: 'Desastre natural',
    defaultStatus: 'Cima/Baixo para selecionar, Enter para relatar',
    cooldownStatus: (sec: number) => `⏳ Tempo de espera... ${sec}s`,
    sendingStatus: 'Localizando e enviando...',
    noCoordsError: 'Não foi possível obter coordenadas',
    reportDesc: 'Relatado via telefone de teclado',
    successStatus: (title: string) => `Sucesso! Registrado: ${title}`,
    failStatus: (err: string) => `Falha: ${err}`,
    serverError: 'Erro no servidor',
    networkError: 'Falha de rede/GPS, tente novamente.',
    gpsLocating: 'Localizando GPS...',
    move: 'Mover', send: 'Enviar', cancelBack: 'Cancelar e Voltar'
  },
  'vi': { // 越南文 (Vietnamese)
    pageTitle: 'Menu Báo cáo',
    titleCrash: 'Tai nạn', titleJam: 'Tắc đường', titleWork: 'Công trường', titleDanger: 'Nguy hiểm', titleDisaster: 'Thiên tai',
    defaultStatus: 'Dùng Lên/Xuống để chọn, Enter để báo cáo',
    cooldownStatus: (sec: number) => `⏳ Đang chờ... đợi ${sec}s`,
    sendingStatus: 'Đang định vị và gửi...',
    noCoordsError: 'Không thể lấy tọa độ',
    reportDesc: 'Báo cáo qua điện thoại phím cứng',
    successStatus: (title: string) => `Thành công! Đã lưu: ${title}`,
    failStatus: (err: string) => `Lỗi: ${err}`,
    serverError: 'Lỗi máy chủ',
    networkError: 'Lỗi mạng/GPS, thử lại sau.',
    gpsLocating: 'Đang định vị GPS...',
    move: 'Di chuyển', send: 'Gửi', cancelBack: 'Hủy & Quay lại'
  },
  'ha': { // 豪薩語 (Hausa)
    pageTitle: 'Menu na Rahoto',
    titleCrash: 'Hatsarin mota', titleJam: 'Cunkoson ababen hawa', titleWork: 'Aikin hanya', titleDanger: 'Hadari', titleDisaster: 'Bala\'i',
    defaultStatus: 'Yi amfani da Sama/Ƙasa, danna Enter',
    cooldownStatus: (sec: number) => `⏳ Jira kadan... sakan ${sec}`,
    sendingStatus: 'Nemo wuri da aikawa...',
    noCoordsError: 'Ba a iya samun wuri ba',
    reportDesc: 'An kawo rahoto ta wayar maballin',
    successStatus: (title: string) => `Yayi! An yi rikodin: ${title}`,
    failStatus: (err: string) => `Ya gaza: ${err}`,
    serverError: 'Matsalar sabar',
    networkError: 'Matsalar intanet/GPS, sake gwadawa.',
    gpsLocating: 'Nemo GPS...',
    move: 'Matsa', send: 'Aika', cancelBack: 'Soke & Koma'
  },
  'sw': { // 斯瓦希里語 (Swahili)
    pageTitle: 'Menyu ya Ripoti',
    titleCrash: 'Ajali', titleJam: 'Msongamano', titleWork: 'Ujenzi wa barabara', titleDanger: 'Hatari', titleDisaster: 'Janga',
    defaultStatus: 'Tumia Juu/Chini kuchagua, Enter kuripoti',
    cooldownStatus: (sec: number) => `⏳ Tulia... subiri sekunde ${sec}`,
    sendingStatus: 'Inatafuta na kutuma...',
    noCoordsError: 'Imeshindwa kupata kuratibu',
    reportDesc: 'Imeripotiwa kupitia simu ya vitufe',
    successStatus: (title: string) => `Imefanikiwa! Imerekodiwa: ${title}`,
    failStatus: (err: string) => `Imeshindwa: ${err}`,
    serverError: 'Hitilafu ya seva',
    networkError: 'Mtandao/GPS imeshindwa, jaribu tena.',
    gpsLocating: 'Inatafuta GPS...',
    move: 'Sogeza', send: 'Tuma', cancelBack: 'Ghairi & Rudi'
  }
};

export default function ReportPage() {
  const router = useRouter();
  const { fetchLocation, loading, errorMsg } = useGeolocation({ autoFetch: false });

  // 🌐 語言狀態管理
  const [langCode, setLangCode] = useState<string>('zh');

  const [selectedIndex, setSelectedIndex] = useState<number>(0);
  const [isReporting, setIsReporting] = useState(false);
  
  // 🌐 改用結構化的狀態來管理提示訊息，方便在切換語系時也能即時翻譯
  const [status, setStatus] = useState<{
    type: 'default' | 'cooldown' | 'sending' | 'success' | 'fail' | 'network_error';
    payload?: string | number;
  }>({ type: 'default' });

  // 用來追蹤每一個選項的 DOM 元素，以便自動捲動
  const itemRefs = useRef<(HTMLDivElement | null)[]>([]);

  // 🌐 初始化抓取使用者系統語言
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const navLang = navigator.language.split('-')[0].toLowerCase();
      if (navigator.language.toLowerCase().startsWith('zh')) {
        setLangCode('zh');
      } else if (translations[navLang as keyof typeof translations]) {
        setLangCode(navLang);
      } else {
        setLangCode('en'); // 找不到支援的語言時，強制使用英文
      }
    }
  }, []);

  const t = translations[langCode as keyof typeof translations] || translations['zh'];

  // 動態獲取本地化的選項清單
  const getReportOptions = () => [
    { title: t.titleCrash, event: 'car_crash' },
    { title: t.titleJam, event: 'traffic_jam' },
    { title: t.titleWork, event: 'roadwork' },
    { title: t.titleDanger, event: 'unknown_danger' },
    { title: t.titleDisaster, event: 'natural_disaster' },
  ];
  const currentOptions = getReportOptions();

  // 根據狀態動態產生顯示的文字
  let displayMessage = t.defaultStatus;
  if (status.type === 'cooldown') displayMessage = t.cooldownStatus(status.payload as number);
  else if (status.type === 'sending') displayMessage = t.sendingStatus;
  else if (status.type === 'success') displayMessage = t.successStatus(status.payload as string);
  else if (status.type === 'fail') {
    const errText = status.payload === 'serverError' ? t.serverError : (status.payload as string);
    displayMessage = t.failStatus(errText);
  }
  else if (status.type === 'network_error') displayMessage = t.networkError;

  // 當選中的索引改變時，自動將該項目捲動到可視範圍內
  useEffect(() => {
    if (itemRefs.current[selectedIndex]) {
      itemRefs.current[selectedIndex]?.scrollIntoView({
        behavior: 'smooth',
        block: 'nearest', 
      });
    }
  }, [selectedIndex]);

  // 處理實際送出回報的邏輯
  const handleReport = async (option: { title: string, event: string }) => {
    if (isReporting || loading) return;

    // 🌟 【新增：30 秒回報冷卻機制】防止連點或洗版
    const COOLDOWN_SECONDS = 30;
    const lastReportStr = localStorage.getItem('my_last_report_time');
    
    if (lastReportStr) {
      const elapsedMs = Date.now() - parseInt(lastReportStr, 10);
      const elapsedSecs = Math.floor(elapsedMs / 1000);

      // 如果距離上次回報還不到 30 秒，擋下來！
      if (elapsedSecs < COOLDOWN_SECONDS) {
        const remainingSecs = COOLDOWN_SECONDS - elapsedSecs;
        setStatus({ type: 'cooldown', payload: remainingSecs });
        
        // 3 秒後恢復原本的提示文字
        setTimeout(() => {
          setStatus({ type: 'default' });
        }, 3000);
        return; // 直接中斷，不送出 API
      }
    }

    setIsReporting(true);
    setStatus({ type: 'sending' });

    try {
      const currentCoords = await fetchLocation();

      if (!currentCoords || !currentCoords.lat || !currentCoords.lng) {
        throw new Error(errorMsg || t.noCoordsError);
      }

      const response = await fetch('/api/newMapinfo', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          longtitude: currentCoords.lng,
          latitude: currentCoords.lat,
          title: option.title,          // 送出已翻譯的標題
          description: t.reportDesc,    // 送出已翻譯的描述
          events: option.event,
        }),
      });

      const result = await response.json();

      if (response.ok && result.success) {
        // 成功送出後，更新時間戳記（同時給冷卻鎖、以及左下角警示燈過濾用）
        localStorage.setItem('my_last_report_time', Date.now().toString());
        
        setStatus({ type: 'success', payload: option.title });
        setTimeout(() => {
          router.push('/');
        }, 2000);
      } else {
        console.error('API 錯誤回應:', result);
        setStatus({ type: 'fail', payload: result.error || 'serverError' });
        setIsReporting(false);
        setTimeout(() => {
          setStatus({ type: 'default' });
        }, 3000);
      }
    } catch (error) {
      console.error('處理回報時發生錯誤:', error);
      setStatus({ type: 'network_error' });
      setIsReporting(false);
      setTimeout(() => {
        setStatus({ type: 'default' });
      }, 3000);
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
      dir={langCode === 'ar' ? 'rtl' : 'ltr'} // 🌟 自動支援阿拉伯文的右到左排版
      style={{
        width: '100%',
        maxWidth: '240px',          // 最大寬度保護
        height: '100vh',            // 滿版高度
        maxHeight: '320px',         // 限制在功能機的最大高度內
        margin: '0 auto',
        overflow: 'hidden',         // 隱藏整頁的捲動，避免雙層捲軸
        boxSizing: 'border-box',
        padding: '6px',
        display: 'flex',
        flexDirection: 'column',    // 使用 flex 讓中間容器自動延展
        alignItems: 'center',
        backgroundColor: '#ffffff',
        fontFamily: 'sans-serif',
      }}
    >
      {/* 頂部狀態與提示區 (設定 flexShrink: 0 避免被壓縮) */}
      <div style={{ flexShrink: 0, textAlign: 'center', width: '100%' }}>
        <h2 style={{ fontSize: '14px', fontWeight: 'bold', marginBottom: '2px', color: '#000000' }}>
          {t.pageTitle}
        </h2>
        <div style={{ 
          fontSize: '11px', 
          color: (isReporting || loading || status.type === 'cooldown') ? '#2563eb' : '#dc2626', 
          marginBottom: '6px', 
          fontWeight: 'bold' 
        }}>
          {loading ? t.gpsLocating : displayMessage}
        </div>
      </div>

      {/* 模擬手機大小的顯示容器 (選單區) */}
      <div
        style={{
          width: '210px',
          flex: 1,                  // 自動填滿標題與底部按鈕之間的剩餘空間
          overflowY: 'scroll',      // 允許捲動以配合 scrollIntoView
          scrollbarWidth: 'none',   // 隱藏 Firefox 捲軸
          msOverflowStyle: 'none',  // 隱藏 IE/Edge 捲軸
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
                flexShrink: 0, // 確保選項卡片不會被擠壓變形
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

      {/* 底部按鍵指引與取消按鈕 (設定 flexShrink: 0 確保貼齊底部) */}
      <div style={{ flexShrink: 0, width: '210px', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
        {/* 按鍵操作指引 */}
        <div style={{ fontSize: '10px', color: '#4b5563', marginTop: '6px', marginBottom: '4px', lineHeight: '1.3', textAlign: 'center' }}>
          <span><strong>[↑/2] [↓/5]</strong> {t.move} | <strong>[Enter]</strong> {t.send}</span>
        </div>

        {/* 底部取消按鈕 */}
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