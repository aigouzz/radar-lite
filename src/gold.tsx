import React, { useEffect, useRef } from 'react';

const Gold: React.FC = () => {
    const containerRef = useRef<HTMLDivElement>(null);
    useEffect(() => {
        // 动态加载外部脚本
        const script = document.createElement("script");
        script.src = "https://s3.tradingview.com/tv.js";
        script.async = true;
        script.onload = () => {
        // 脚本加载完再初始化
        if (containerRef.current) {
            new (window as any).TradingView.widget({
            autosize: true,
            symbol: "OANDA:XAUUSD",
            interval: "D",
            timezone: "Asia/Shanghai",
            theme: "dark",
            style: "1",
            locale: "zh_CN",
            toolbar_bg: "#131722",
            enable_publishing: false,
            hide_top_toolbar: false,
            hide_legend: false,
            save_image: true,
            container_id: "tradingview_chart",
            studies: [
                "MASimple@tv-basicstudies",
                "MACD@tv-basicstudies",
                "Volume@tv-basicstudies",
            ],
            show_popup_button: true,
            popup_width: "1000",
            popup_height: "650",
            withdateranges: true,
            allow_symbol_change: true,
            details: true,
            backgroundColor: "#131722",
            gridColor: "rgba(255, 255, 255, 0.03)",
            });
        }
        };
        document.head.appendChild(script);

        // 组件卸载时清理
        return () => {
            document.head.removeChild(script);
        };
    }, []);
  return (
    <div
      id="tradingview_chart"
      ref={containerRef}
      style={{ width: "100%", height: "600px" }}
    ></div>
  );
};

export default Gold;
