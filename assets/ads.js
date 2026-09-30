document.querySelectorAll('.ad-frame').forEach(frame=>{
 const iframe=frame.querySelector('iframe'),width=Number(frame.dataset.adWidth),height=Number(frame.dataset.adHeight)||250;
 if(!iframe)return;
 function fit(){const available=frame.clientWidth;if(!available)return;const scale=width?Math.min(1,available/width):1;iframe.style.width=width?width+'px':'100%';iframe.style.maxWidth='none';iframe.style.height=height+'px';iframe.style.transform=`scale(${scale})`;iframe.style.transformOrigin='top left';iframe.style.marginLeft=width?Math.max(0,(available-width*scale)/2)+'px':'0';frame.style.height=height*scale+'px';}
 fit();new ResizeObserver(fit).observe(frame);
});
