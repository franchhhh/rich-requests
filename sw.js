/* РИЧ / Заявки — прием Web Push для установленного приложения */
self.addEventListener('install',()=>self.skipWaiting());
self.addEventListener('activate',event=>event.waitUntil(self.clients.claim()));
self.addEventListener('push',event=>{
  let data={};try{data=event.data?.json()||{}}catch{data={body:event.data?.text()||''}}
  const target=data.url||'./';
  event.waitUntil(self.registration.showNotification(data.title||'РИЧ / Заявки',{
    body:data.body||'Новая заявка',tag:data.tag||undefined,
    icon:'./icon.svg',data:{url:target}
  }));
});
self.addEventListener('notificationclick',event=>{
  event.notification.close();
  const target=new URL(event.notification.data?.url||'./',self.registration.scope).href;
  event.waitUntil((async()=>{
    const open=await self.clients.matchAll({type:'window',includeUncontrolled:true});
    for(const client of open){if(new URL(client.url).origin===new URL(target).origin){await client.navigate(target);return client.focus()}}
    return self.clients.openWindow(target);
  })());
});
