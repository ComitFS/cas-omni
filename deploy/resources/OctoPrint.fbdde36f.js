import{s as u}from"./service.541fc1e6.js";import{_ as h,G as f,r as _,o as t,c as y,w as p,a as o,t as r,b as s,F as l,d as m,e as i,n as T,p as g,f as b}from"./index.5ebc9ad0.js";const k={name:"OctoPrint",mixins:[u],props:{item:Object},components:{Generic:f},data:()=>({printTime:null,printTimeLeft:null,completion:null,state:null,error:null}),computed:{statusClass:function(){switch(this.state){case"Operational":return"ready";case"Offline":return"offline";case"Printing":return"in-progress";default:return"pending"}}},created(){this.display=this.item.display=="bar"?this.item.display:"text",this.fetchStatus()},methods:{fetchStatus:async function(){try{const e=await this.fetch(`api/job?apikey=${this.item.apikey}`);this.printTime=e.progress.printTime,this.printTimeLeft=e.progress.printTimeLeft,this.completion=e.progress.completion,this.state=e.state,this.error=e.error}catch(e){this.error=`Fail to fetch octoprint data (${e.message})`,console.error(e)}},toTime:function(e){return new Date(e*1e3).toTimeString().substring(0,5)}}},c=e=>(g("data-v-c058bdd4"),e=e(),b(),e),v={class:"title is-4"},w={class:"subtitle is-6"},S=c(()=>o("i",{class:"fa-solid fa-gear mr-1"},null,-1)),C={key:0},O=c(()=>o("span",{class:"separator mx-1"}," | ",-1)),F=["title"],L=c(()=>o("i",{class:"fa-solid fa-stopwatch mr-1"},null,-1)),B=["value","title"],G=["title"],I=["title"];function P(e,N,a,V,j,n){const d=_("Generic");return t(),y(d,{item:a.item,title:e.state},{content:p(()=>[o("p",v,r(a.item.name),1),o("p",w,[a.item.subtitle&&!e.state?(t(),s(l,{key:0},[m(r(a.item.subtitle),1)],64)):i("",!0),!e.error&&e.display=="text"?(t(),s(l,{key:1},[S,e.completion?(t(),s("b",C,r(e.completion.toFixed())+"%",1)):i("",!0),O,e.printTime?(t(),s("span",{key:1,title:`${n.toTime(e.printTimeLeft)} left`},[L,m(" "+r(n.toTime(e.printTime)),1)],8,F)):i("",!0)],64)):i("",!0),!e.error&&e.display=="bar"?(t(),s(l,{key:2},[e.completion?(t(),s("progress",{key:0,class:"progress is-primary",value:e.completion,max:"100",title:`${e.state} - ${e.completion.toFixed()}%, ${n.toTime(e.printTimeLeft)} left`},r(e.completion)+"% ",9,B)):i("",!0)],64)):i("",!0),e.error?(t(),s("span",{key:3,title:e.error},r(e.error),9,G)):i("",!0)])]),indicator:p(()=>[o("i",{class:T(["status",n.statusClass]),title:e.state},null,10,I)]),_:1},8,["item","title"])}const z=h(k,[["render",P],["__scopeId","data-v-c058bdd4"]]);export{z as default};