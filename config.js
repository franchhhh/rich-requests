// Подключение к тому же проекту Supabase, что и приложение генератора ячеек.
// В Supabase: Project Settings -> API Keys -> Publishable key (или anon public).
// ВАЖНО: никогда не вставляй service_role / secret key в этот файл.
window.RICH_CONFIG = {
  supabaseUrl: 'https://bpkheoullpwkseigluqg.supabase.co',
  supabaseAnonKey: 'sb_publishable_wkkcjGd3bJzyzUtV_VeXiQ_vSSLkFW3',
  vapidPublicKey: 'BHB0iL4kmOxGhVvoT7JDsge1Azqxmz1I37ME2yT_ZBe8qceRiSLPjx3fhMg--y_OE4ZiY4w5anlN0X0Awy3TMPI'
};
