var clicky_obj=clicky_obj||(function(){var instance=null;function _ins(){var _self=this,site_ids=[],pageviews_fired=[],monitors=0,ossassets=0,ossdata=0;this.domain='http://in.getclicky.com';if(document.location.protocol==='https:'){this.domain='https://in.getclicky.com';this.secure=1;}this.init=function(site_id){site_ids.push(site_id);_self.setup_site_id(site_id);};this.setup_site_id=function(site_id){if(clicky_custom.async){setTimeout(_self.advanced,1000);}else{this.add_event(window,'load',_self.advanced);}if(clicky_custom.cookies_disable){_self.set_referrer(document.referrer);}else if(!_self.get_cookie('first_pv_'+site_id)){_self.set_cookie('first_pv_'+site_id,1,1200);_self.set_referrer(document.referrer);}_self.start_monitors();if(!clicky_custom.pageview_disable){if(window.olark){olark('api.boot.onIdentityReady',function(s,v,c){_self.olark(s,v,c,1);});setTimeout(_self.pageview,2000);}else{_self.pageview();}}if(location.hash.match(/^#_heatmap/))_self.heatmap();};this.base=function(site_id_index,type){var url=_self.domain+'/in.php?site_id='+site_ids[site_id_index];if(type=='ping')return url;url+="&res="+screen.width+"x"+screen.height+"&lang="+(navigator.language||navigator.browserLanguage||'en').substr(0,2)+(_self.secure?"&secure=1":"");if(clicky_custom.session){for(var i in clicky_custom.session){if(clicky_custom.session.hasOwnProperty&&clicky_custom.session.hasOwnProperty(i))url+="&custom["+_self.enc(i)+"]="+_self.enc(clicky_custom.session[i]);}}return url;};this.set_referrer=function(r){_self.ref=r?(RegExp("^https?://[^/]*"+location.host.replace(/^www\./i,"")+"/","i").test(r)?'':this.enc(r)):'';};this.olark=function(s,v,c,do_pageview){var o=s+','+v+','+c,c=_self.get_cookie('clicky_olark');if(c&&c==o){if(do_pageview)_self.pageview();return;}else{if(c)_self.set_cookie('clicky_olark',c,-3600);_self.set_cookie('clicky_olark',o,600);c=_self.get_cookie('clicky_olark');}if(do_pageview||pageviews_fired.length==0){_self.pageview('&olark='+o);}else if(c){_self.beacon('ping','&olark='+o);}};this.pageview=function(extra){var href=_self.get_href();if(_self.facebook_is_lame(href))return;_self.beacon('','&href='+_self.enc(href)+'&title='+_self.enc(clicky_custom.title||document.title)+'&ref='+(_self.ref||'')+(extra||''),1);for(var p=0;p<site_ids.length;p++){if(!_self.is_pageview_fired(site_ids[p])){pageviews_fired.push(site_ids[p]);}}};this.get_href=function(enc){var href=clicky_custom.href||'';if(!href){if(clicky_custom.iframe&&self!=top){_self.set_referrer(top.document.referrer);href=top.location.pathname+top.location.search;if(!clicky_custom.title)clicky_custom.title=top.document.title;}else if(location.hash.match(/utm_/i)){href=location.pathname+(location.search?location.search+'&':'?')+location.hash.substr(1);}else href=location.pathname+location.search;}return enc?_self.enc(href):href;};this.log=function(href,title,type){if(_self.facebook_is_lame(href))return;if(type=='pageview')href=href.replace(/^https?:\/\/([^\/]+)/i,'');var o={'type':(type||'click'),'href':href,'title':(title||'')};if(!_self.queue_add(o))_self.beacon(type,o);};this.queue_ok=function(){return window.JSON&&typeof JSON=='object'&&JSON.stringify&&JSON.parse&&!clicky_custom.cookies_disable;};this.queue_add=function(o){if(!_self.queue_ok())return false;if(o.type.match(/pageview|download|outbound/i))return false;var q=_self.queue_get();try{if(o.type=='heatmap'){q.heatmap.push(o);}else{q.events.push(o);}}catch(e){if(_self.debug)console.log(e);return false;}_self.queue_set(q);return true;};this.queue_reset=function(){_self.queue_set(_self.queue_default());};this.queue_get=function(){var q=_self.get_cookie('_eventqueue');return q?JSON.parse(decodeURIComponent(q)):_self.queue_default();};this.queue_set=function(q,ex){for(var i=0;i<q.heatmap.length;i++)q.heatmap[i].href=_self.enc(q.heatmap[i].href);for(var i=0;i<q.events.length;i++){q.events[i].href=_self.enc(q.events[i].href);if(q.events[i].title)q.events[i].title=_self.enc(q.events[i].title);}_self.set_cookie('_eventqueue',encodeURIComponent(JSON.stringify(q)),(ex||600));};this.queue_default=function(){return{'heatmap':[],'events':[]};};this.queue_process=function(){var q=_self.queue_get();try{if(q.heatmap.length||q.events.length)_self.queue_reset();for(var i=0,s='';i<q.heatmap.length;i++){var o=q.heatmap[i];s+='&heatmap[]='+_self.enc(o.href)+'|'+o.x+'|'+o.y+'|'+o.w;}if(s)_self.beacon('heatmap',s);while(q.events.length)_self.beacon('',q.events.shift());}catch(e){if(_self.debug)console.log(e);}};this.heatmap_xy=function(e){var x,y;if(e.pageX){x=e.pageX;y=e.pageY;}else if(e.clientX){x=e.clientX+document.body.scrollLeft+document.documentElement.scrollLeft;y=e.clientY+document.body.scrollTop+document.documentElement.scrollTop;}else return;var w=_self.doc_wh(),href=_self.get_href();if(!clicky_custom.heatmap_disable)_self.queue_add({'type':'heatmap','x':x,'y':y,'w':w.w,'href':href});};this.doc_wh=function(){var db=document.body,de=document.documentElement;return{w:window.innerWidth||de.clientWidth||1024,h:Math.max(db.scrollHeight,db.offsetHeight,de.clientHeight,de.scrollHeight,de.offsetHeight)}};this.heatmap=function(date,sub,subitem){if(window._heatmap_destroy)_heatmap_destroy();if(window.heatmapFactory)_self.heatmap_data(date,sub,subitem);else{_self.inject('//static.getclicky.com/inc/javascript/heatmap.js');setTimeout('_genericStats.heatmap("'+(date||'')+'","'+(sub||'')+'","'+(subitem||'')+'")',1000);}};this.heatmap_data=function(date,sub,subitem){wh=_self.doc_wh();_self.inject('https://secure.getclicky.com/ajax/onsitestats/heatmap?'+'site_id='+site_ids[0]+'&href='+_self.get_href(1)+'&domain='+location.hostname+'&w='+wh.w+'&h='+wh.h+(location.hash.match(/^#_heatmap/)?location.hash.replace(/^#_heatmap/,''):'')+(date?'&date='+date:'')+(sub?'&sub='+sub:'')+(subitem?'&subitem='+subitem:'')+'&x='+Math.random());};this.onsitestats=function(refresh,reset){if(ossassets){if(window.jQuery&&window._OSS){if(_self.jqnc){jQuery.noConflict();_self.jqnc=0;}if(!ossdata||refresh){ossdata=1;_self.inject('https://secure.getclicky.com/ajax/onsitestats/?site_id='+site_ids[0]+'&href='+_self.get_href(1)+'&domain='+location.hostname+(refresh?'&refresh=1':'')+(reset?'&reset=1':'')+'&x='+Math.random());}}else setTimeout(_self.onsitestats,200);}else{ossassets=1;_self.inject('//static.getclicky.com/inc/onsitestats.css','css');_self.inject('//static.getclicky.com/inc/javascript/onsitestats.js');if(!window.jQuery){_self.inject('//static.getclicky.com/inc/javascript/jquery.js');_self.jqnc=1;}setTimeout(_self.onsitestats,1000);}};this.start_monitors=function(){if(!monitors){monitors=1;if(_self.queue_ok()){_self.queue_process();setInterval(_self.queue_process,5000);}_self.hm_monitor();}};this.hm_monitor=function(){if(document.body){_self.add_event(document.body,'click',_self.heatmap_xy);}else setTimeout(_self.hm_monitor,1000);};this.facebook_is_lame=function(href){return href.match(/fb_xd_fragment|fb_xd_bust|fbc_channel/i);};this.video=function(action,time,url,title){if(!url||!action)return false;_self.beacon('video','&video[action]='+action+'&video[time]='+(time||0)+'&href='+_self.enc(url)+(title?'&title='+_self.enc(title):''));};this.goal=function(id,revenue){if(!id)return;var goal=(typeof id=='number'||id.match(/^[0-9]+$/))?'[id]='+id:'[name]='+_self.enc(id);_self.beacon('goal','&goal'+goal+(revenue?'&goal[revenue]='+revenue:''));};this.beacon=function(type,q,called_by_pageview){q=q||'';type=type||'pageview';if(typeof q=='object'){if(q.type)type=q.type;var temp='';for(var i in q){if(i!='type'&&q.hasOwnProperty&&q.hasOwnProperty(i))temp+='&'+i+'='+_self.enc(q[i]);}q=temp;delete temp;}var jsuid='',goal='',split='';jsuid=_self.get_cookie('_jsuid');if(!jsuid){_self.set_cookie('_jsuid',_self.randy());jsuid=_self.get_cookie('_jsuid');}if(type!='heatmap'&&type!='ping'){if(clicky_custom.goal){if(typeof clicky_custom.goal=='object'){for(var i in clicky_custom.goal){if(clicky_custom.goal.hasOwnProperty&&clicky_custom.goal.hasOwnProperty(i))goal+='&goal['+_self.enc(i)+']='+_self.enc(clicky_custom.goal[i]);}}else{goal='&goal='+_self.enc(clicky_custom.goal);}clicky_custom.goal='';}if(clicky_custom.split){for(var i in clicky_custom['split']){if(clicky_custom['split'].hasOwnProperty&&clicky_custom['split'].hasOwnProperty(i)){if(i=='goal'&&typeof clicky_custom['split'].goal=='object'){for(var j=0,l=clicky_custom['split'].goal.length;j<l;j++){split+='&split[goal][]='+clicky_custom.split.goal[j];}}else split+='&split['+_self.enc(i)+']='+_self.enc(clicky_custom.split[i]);}}clicky_custom.split='';}}for(var site_id_index=0;site_id_index<site_ids.length;site_id_index++){var site_id=site_ids[site_id_index];if(_self.get_cookie('no_tracky_'+site_id))continue;if(_self.get_cookie('unpoco_'+site_id)&&(_self.secure||type!='pageview'))continue;if(type=='heatmap'&&_self.get_cookie('heatmaps_g2g_'+site_id)!='yes')continue;if(called_by_pageview&&type=='pageview'&&_self.is_pageview_fired(site_id))continue;_self.inject(_self.base(site_id_index,type)+'&type='+type+q+goal+split+(jsuid?'&jsuid='+jsuid:'')+(_self.get_cookie('unpoco_'+site_id)?'&upset':'')+(_self.get_cookie('heatmaps_g2g_'+site_id)?'&hmset':'')+(clicky_custom.cookies_disable?'&noc':'')+'&mime=js&x='+Math.random()+'');if(type=='outbound'||type=='download')_self.pause();}_self.ref='';_self.ping_start();};this.inject=function(src,type){type=type||'js';if(type=='js'){var s=document.createElement('script');s.type='text/javascript';s.async=true;s.src=src;}else if(type=='css'){var s=document.createElement('link');s.type='text/css';s.rel='stylesheet';s.href=src;}(document.getElementsByTagName('head')[0]||document.getElementsByTagName('body')[0]).appendChild(s);};this.is_pageview_fired=function(site_id){for(var p=0;p<pageviews_fired.length;p++)if(pageviews_fired[p]==site_id)return true;return false;};this.ping=function(){_self.beacon('ping');};this.ping_set=function(){var pingy=setInterval(_self.ping,120000);setTimeout("clearInterval("+pingy+")",_self.ps_stop*1000);_self.ping();};this.ping_start=function(){if(clicky_custom.ping_disable||_self.pinging)return;_self.pinging=1;_self.ps_stop=(clicky_custom.timeout&&clicky_custom.timeout>=5&&clicky_custom.timeout<=240)?((clicky_custom.timeout*60)-120)+5:485;setTimeout(_self.ping,30000);setTimeout(_self.ping,60000);setTimeout(_self.ping_set,120000);};this.get_cookie=function(name){var ca=document.cookie.split(';');for(var i=0,l=ca.length;i<l;i++){if(eval("ca[i].match(/\\b"+name+"=/)"))return decodeURIComponent(ca[i].split(name+'=')[1]);}return'';};this.set_cookie=function(name,value,expires){if(clicky_custom.cookies_disable)return false;var ex=new Date;ex.setTime(ex.getTime()+(expires||20*365*86400)*1000);document.cookie=name+"="+value+";expires="+ex.toGMTString()+";path=/;domain="+(clicky_custom.cookie_domain||"."+location.hostname.replace(/^www\./i,""))+";";};this.randy=function(){return Math.round(Math.random()*4294967295);};this.pause=function(x){var now=new Date();var stop=now.getTime()+(x||clicky_custom.timer||500);while(now.getTime()<stop)var now=new Date();};this.enc=function(e){return window.encodeURIComponent?encodeURIComponent(e):escape(e);};this.add_event=function(o,type,func){if(o.addEventListener){o.addEventListener(type,func,false);}else if(o.attachEvent){o.attachEvent("on"+type,func);}};this.download=function(e){_self.adv_log(e,"download");};this.outbound=function(e){_self.adv_log(e,"outbound");};this.click=function(e){_self.adv_log(e,"click");};this.adv_log=function(e,type){var obj=_self.get_target(e);_self.log(_self.adv_href(obj),_self.adv_text(obj),type);};this.adv_text=function(e){do{var txt=e.text?e.text:e.innerText;if(txt)return txt;if(e.alt)return e.alt;if(e.title)return e.title;if(e.src)return e.src;e=_self.get_parent(e);}while(e);return"";};this.adv_href=function(e){do{if(e.href&&!e.src)return e.href;e=_self.get_parent(e);}while(e);return"";};this.get_parent=function(e){return e.parentElement||e.parentNode;};this.get_target=function(e){if(!e)var e=window.event;var t=e.target?e.target:e.srcElement;if(t.nodeType&&t.nodeType==3)t=t.parentNode;return t;};this.advanced=function(){if(clicky_custom.advanced_disable)return;var is_link=new RegExp("^(https?|ftp|telnet|mailto):","i");var is_link_internal=new RegExp("^https?:\/\/(.*)"+location.host.replace(/^www\./i,""),"i");var is_download=new RegExp("\\.(7z|aac|apk|avi|cab|csv|dmg|doc(x|m|b)?|epub|exe|flv|gif|gz|jpe?g|js|m4a|mp(3|4|e?g)|mobi|mov|msi|ods|pdf|phps|png|ppt(x|m|b)?|rar|rtf|sea|sit|tar|torrent|txt|wma|wmv|xls(x|m|b)?|xml|zip)$","i");var a=document.getElementsByTagName("a");for(var i=0;i<a.length;i++){if(a[i].className.match(/clicky_log/i)){if(a[i].className.match(/clicky_log_download/i)){_self.add_event(a[i],"mousedown",_self.download);}else if(a[i].className.match(/clicky_log_outbound/i)){_self.add_event(a[i],"mousedown",_self.outbound);}else{_self.add_event(a[i],"mousedown",_self.click);}}else{if(is_link.test(a[i].href)&&!a[i].className.match(/clicky_ignore/i)){if(is_download.test(a[i].href)){_self.add_event(a[i],"mousedown",_self.download);}else if(!is_link_internal.test(a[i].href)){_self.add_event(a[i],"mousedown",_self.outbound);}else if(clicky_custom.outbound_pattern){var p=clicky_custom.outbound_pattern;if(typeof p=='object'){for(var j=0;j<p.length;j++){if(_self.outbound_pattern_match(a[i].href,p[j])){_self.add_event(a[i],"mousedown",_self.outbound);break;}}}else if(typeof p=='string'){if(_self.outbound_pattern_match(a[i].href,p))_self.add_event(a[i],"mousedown",_self.outbound);}}}}}};this.outbound_pattern_match=function(href,pattern){return RegExp(pattern.replace(/[-[\]{}()*+?.,\\^$|#\s]/g,"\\$&")).test(href);};}return new function(){this.getInstance=function(){if(instance==null){instance=new _ins();instance.constructor=null;}return instance;}}})();var clicky=clicky_obj.getInstance();if(!window.clicky_custom)clicky_custom={};if(window.clicky_page_title)clicky_custom.title=clicky_page_title;if(window.clicky_advanced_disable)clicky_custom.advanced_disable=1;if(window.clicky_pause_timer)clicky_custom.timer=clicky_pause_timer;if(window.clicky_custom_session)clicky_custom.session=clicky_custom_session;if(window.clicky_goal)clicky_custom.goal=clicky_goal;if(clicky_custom.no_cookies)clicky_custom.cookies_disable=1;if(window.async_site_id)var clicky_site_id=async_site_id;if(window.clicky_site_id){var clicky_site_ids=clicky_site_ids||[];clicky_site_ids.push(clicky_site_id);}if(window.clicky_site_ids){clicky_custom.async=1;while(clicky_site_ids.length)clicky.init(clicky_site_ids.shift());}var _genericStats=clicky,_genericStatsCustom=clicky_custom;