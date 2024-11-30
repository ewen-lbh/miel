import{s as we,e as y,a as q,c as C,b as N,g as S,f as u,o as I,i as _,h as v,L as Se,I as je,t as R,C as M,H as ie,m as Me,d as z,x as se,M as Q,p as me,j as re,N as Ie,k as de,q as he}from"../chunks/scheduler.5XQODGQl.js";import{S as He,i as Ee,c as ee,a as te,m as le,t as P,g as Ne,e as Oe,b as F,d as ne,f as Le}from"../chunks/index.CmFOe5Tk.js";import{S as Ae,a as Be,c as Ge}from"../chunks/TableOfContents.BaNsGTmv.js";import{e as _e,d as pe}from"../chunks/colors.CpYFywWW.js";import{M as Te}from"../chunks/ModuleCard.BaN8tAWY.js";function ge(a,e,f){const t=a.slice();return t[1]=e[f],t}function be(a){let e,f;return e=new Te({props:{module:a[1]}}),{c(){ee(e.$$.fragment)},l(t){te(e.$$.fragment,t)},m(t,s){le(e,t,s),f=!0},p(t,s){const r={};s&1&&(r.module=t[1]),e.$set(r)},i(t){f||(P(e.$$.fragment,t),f=!0)},o(t){F(e.$$.fragment,t),f=!1},d(t){ne(e,t)}}}function Pe(a){var o,d,g,b;let e,f,t,s,r=_e(a[0]),l=[];for(let c=0;c<r.length;c+=1)l[c]=be(ge(a,r,c));const i=c=>F(l[c],1,1,()=>{l[c]=null});return t=new Te({props:{module:{name:"index",displayName:((d=(o=pe.config.modules)==null?void 0:o.index)==null?void 0:d.title)??"Index",shortDescription:((b=(g=pe.config.modules)==null?void 0:g.index)==null?void 0:b.description)??"Every item on a single page"}}}),{c(){e=y("section");for(let c=0;c<l.length;c+=1)l[c].c();f=q(),ee(t.$$.fragment),this.h()},l(c){e=C(c,"SECTION",{class:!0});var p=N(e);for(let m=0;m<l.length;m+=1)l[m].l(p);f=S(p),te(t.$$.fragment,p),p.forEach(u),this.h()},h(){I(e,"class","modules-list svelte-1i1yu0u")},m(c,p){_(c,e,p);for(let m=0;m<l.length;m+=1)l[m]&&l[m].m(e,null);v(e,f),le(t,e,null),s=!0},p(c,[p]){if(p&1){r=_e(c[0]);let m;for(m=0;m<r.length;m+=1){const j=ge(c,r,m);l[m]?(l[m].p(j,p),P(l[m],1)):(l[m]=be(j),l[m].c(),P(l[m],1),l[m].m(e,f))}for(Ne(),m=r.length;m<l.length;m+=1)i(m);Oe()}},i(c){if(!s){for(let p=0;p<r.length;p+=1)P(l[p]);P(t.$$.fragment,c),s=!0}},o(c){l=l.filter(Boolean);for(let p=0;p<l.length;p+=1)F(l[p]);F(t.$$.fragment,c),s=!1},d(c){c&&u(e),Se(l,c),ne(t)}}}function Qe(a,e,f){let{modules:t}=e;return a.$$set=s=>{"modules"in s&&f(0,t=s.modules)},[t]}class Re extends He{constructor(e){super(),Ee(this,e,Qe,Pe,we,{modules:0})}}function ve(a){let e,f;return{c(){e=y("img"),this.h()},l(t){e=C(t,"IMG",{src:!0,"aria-hidden":!0,class:!0}),this.h()},h(){he(e.src,f=a[0].config.branding.logo[a[3]])||I(e,"src",f),I(e,"aria-hidden","true"),I(e,"class","svelte-aot1jw")},m(t,s){_(t,e,s)},p(t,s){s&9&&!he(e.src,f=t[0].config.branding.logo[t[3]])&&I(e,"src",f)},d(t){t&&u(e)}}}function ye(a){let e,f="Pagination",t,s,r="GraphQL Relay",l,i,o=(a[0].config.relay.node??"edges.node")+"",d,g;return{c(){e=y("dt"),e.textContent=f,t=y("dd"),s=y("a"),s.textContent=r,l=R(`
			(nodes on `),i=y("code"),d=R(o),g=R(`)
		`),this.h()},l(b){e=C(b,"DT",{"data-svelte-h":!0}),Q(e)!=="svelte-1rwkuwe"&&(e.textContent=f),t=C(b,"DD",{});var c=N(t);s=C(c,"A",{href:!0,"data-svelte-h":!0}),Q(s)!=="svelte-1hmujgi"&&(s.textContent=r),l=z(c,`
			(nodes on `),i=C(c,"CODE",{});var p=N(i);d=z(p,o),p.forEach(u),g=z(c,`)
		`),c.forEach(u),this.h()},h(){I(s,"href","https://graphql.org/learn/pagination/#complete-connection-model")},m(b,c){_(b,e,c),_(b,t,c),v(t,s),v(t,l),v(t,i),v(i,d),v(t,g)},p(b,c){c&1&&o!==(o=(b[0].config.relay.node??"edges.node")+"")&&re(d,o)},d(b){b&&(u(e),u(t))}}}function Ce(a){let e,f="Errors types",t,s,r,l=(a[0].config.errors.data??"data")+"",i,o;return{c(){e=y("dt"),e.textContent=f,t=y("dd"),s=R("Success data on "),r=y("code"),i=R(l),o=q()},l(d){e=C(d,"DT",{"data-svelte-h":!0}),Q(e)!=="svelte-pyaz1w"&&(e.textContent=f),t=C(d,"DD",{});var g=N(t);s=z(g,"Success data on "),r=C(g,"CODE",{});var b=N(r);i=z(b,l),b.forEach(u),o=S(g),g.forEach(u)},m(d,g){_(d,e,g),_(d,t,g),v(t,s),v(t,r),v(r,i),v(t,o)},p(d,g){g&1&&l!==(l=(d[0].config.errors.data??"data")+"")&&re(i,l)},d(d){d&&(u(e),u(t))}}}function $e(a){let e,f="Queries",t,s,r=a[0].queryTypeDescriptionHtml+"",l;return{c(){e=y("h2"),e.textContent=f,t=q(),s=new ie(!1),l=M(),this.h()},l(i){e=C(i,"H2",{"data-svelte-h":!0}),Q(e)!=="svelte-1c2y986"&&(e.textContent=f),t=S(i),s=se(i,!1),l=M(),this.h()},h(){s.a=l},m(i,o){_(i,e,o),_(i,t,o),s.m(r,i,o),_(i,l,o)},p(i,o){o&1&&r!==(r=i[0].queryTypeDescriptionHtml+"")&&s.p(r)},d(i){i&&(u(e),u(t),u(l),s.d())}}}function De(a){let e,f="Mutations",t,s,r=a[0].mutationTypeDescriptionHtml+"",l;return{c(){e=y("h2"),e.textContent=f,t=q(),s=new ie(!1),l=M(),this.h()},l(i){e=C(i,"H2",{"data-svelte-h":!0}),Q(e)!=="svelte-1wga2ui"&&(e.textContent=f),t=S(i),s=se(i,!1),l=M(),this.h()},h(){s.a=l},m(i,o){_(i,e,o),_(i,t,o),s.m(r,i,o),_(i,l,o)},p(i,o){o&1&&r!==(r=i[0].mutationTypeDescriptionHtml+"")&&s.p(r)},d(i){i&&(u(e),u(t),u(l),s.d())}}}function ke(a){let e,f="Subscriptions",t,s,r=a[0].subscriptionTypeDescriptionHtml+"",l;return{c(){e=y("h2"),e.textContent=f,t=q(),s=new ie(!1),l=M(),this.h()},l(i){e=C(i,"H2",{"data-svelte-h":!0}),Q(e)!=="svelte-1lxf0m8"&&(e.textContent=f),t=S(i),s=se(i,!1),l=M(),this.h()},h(){s.a=l},m(i,o){_(i,e,o),_(i,t,o),s.m(r,i,o),_(i,l,o)},p(i,o){o&1&&r!==(r=i[0].subscriptionTypeDescriptionHtml+"")&&s.p(r)},d(i){i&&(u(e),u(t),u(l),s.d())}}}function ze(a){let e,f,t,s,r,l=a[0].config.branding.name+"",i,o,d,g,b,c,p,m,j,ae,U,$,J,V=a[0].descriptionHtml+"",W,X,Y,Z,B,fe="Modules",x,O,L;document.title=e="Documentation—"+a[0].config.branding.name;let D=a[0].config.branding.logo[a[3]]&&ve(a),k=a[0].config.relay&&ye(a),w=a[0].config.errors&&Ce(a);function qe(n){a[4](n)}let ce={};a[1]!==void 0&&(ce.query=a[1]),j=new Ae({props:ce}),je.push(()=>Le(j,"query",qe));let H=a[0].queryTypeDescriptionHtml&&$e(a),E=a[0].mutationTypeDescriptionHtml&&De(a),T=a[0].subscriptionTypeDescriptionHtml&&ke(a);return O=new Re({props:{modules:a[0].modules}}),{c(){f=q(),t=y("header"),D&&D.c(),s=q(),r=y("h1"),i=R(l),o=q(),d=y("dl"),g=M(),k&&k.c(),b=M(),w&&w.c(),c=M(),p=q(),m=y("section"),ee(j.$$.fragment),U=q(),$=y("section"),J=new ie(!1),W=q(),H&&H.c(),X=q(),E&&E.c(),Y=q(),T&&T.c(),Z=q(),B=y("h2"),B.textContent=fe,x=q(),ee(O.$$.fragment),this.h()},l(n){Me("svelte-o03fky",document.head).forEach(u),f=S(n),t=C(n,"HEADER",{class:!0});var G=N(t);D&&D.l(G),s=S(G),r=C(G,"H1",{class:!0});var K=N(r);i=z(K,l),K.forEach(u),G.forEach(u),o=S(n),d=C(n,"DL",{class:!0});var oe=N(d);g=M(),k&&k.l(oe),b=M(),w&&w.l(oe),c=M(),oe.forEach(u),p=S(n),m=C(n,"SECTION",{class:!0});var ue=N(m);te(j.$$.fragment,ue),ue.forEach(u),U=S(n),$=C(n,"SECTION",{class:!0});var A=N($);J=se(A,!1),W=S(A),H&&H.l(A),X=S(A),E&&E.l(A),Y=S(A),T&&T.l(A),A.forEach(u),Z=S(n),B=C(n,"H2",{"data-svelte-h":!0}),Q(B)!=="svelte-15y87h"&&(B.textContent=fe),x=S(n),te(O.$$.fragment,n),this.h()},h(){I(r,"class","svelte-aot1jw"),I(t,"class","svelte-aot1jw"),me(t,"has-toc",a[2]),I(d,"class","basic-info svelte-aot1jw"),I(m,"class","search svelte-aot1jw"),J.a=W,I($,"class","description svelte-aot1jw")},m(n,h){_(n,f,h),_(n,t,h),D&&D.m(t,null),v(t,s),v(t,r),v(r,i),_(n,o,h),_(n,d,h),v(d,g),k&&k.m(d,null),v(d,b),w&&w.m(d,null),v(d,c),_(n,p,h),_(n,m,h),le(j,m,null),_(n,U,h),_(n,$,h),J.m(V,$),v($,W),H&&H.m($,null),v($,X),E&&E.m($,null),v($,Y),T&&T.m($,null),_(n,Z,h),_(n,B,h),_(n,x,h),le(O,n,h),L=!0},p(n,[h]){(!L||h&1)&&e!==(e="Documentation—"+n[0].config.branding.name)&&(document.title=e),n[0].config.branding.logo[n[3]]?D?D.p(n,h):(D=ve(n),D.c(),D.m(t,s)):D&&(D.d(1),D=null),(!L||h&1)&&l!==(l=n[0].config.branding.name+"")&&re(i,l),(!L||h&4)&&me(t,"has-toc",n[2]),n[0].config.relay?k?k.p(n,h):(k=ye(n),k.c(),k.m(d,b)):k&&(k.d(1),k=null),n[0].config.errors?w?w.p(n,h):(w=Ce(n),w.c(),w.m(d,c)):w&&(w.d(1),w=null);const G={};!ae&&h&2&&(ae=!0,G.query=n[1],Ie(()=>ae=!1)),j.$set(G),(!L||h&1)&&V!==(V=n[0].descriptionHtml+"")&&J.p(V),n[0].queryTypeDescriptionHtml?H?H.p(n,h):(H=$e(n),H.c(),H.m($,X)):H&&(H.d(1),H=null),n[0].mutationTypeDescriptionHtml?E?E.p(n,h):(E=De(n),E.c(),E.m($,Y)):E&&(E.d(1),E=null),n[0].subscriptionTypeDescriptionHtml?T?T.p(n,h):(T=ke(n),T.c(),T.m($,null)):T&&(T.d(1),T=null);const K={};h&1&&(K.modules=n[0].modules),O.$set(K)},i(n){L||(P(j.$$.fragment,n),P(O.$$.fragment,n),L=!0)},o(n){F(j.$$.fragment,n),F(O.$$.fragment,n),L=!1},d(n){n&&(u(f),u(t),u(o),u(d),u(p),u(m),u(U),u($),u(Z),u(B),u(x)),D&&D.d(),k&&k.d(),w&&w.d(),ne(j),H&&H.d(),E&&E.d(),T&&T.d(),ne(O,n)}}}function Fe(a,e,f){let t,s;de(a,Be,o=>f(2,t=o)),de(a,Ge,o=>f(3,s=o));let{data:r}=e,l="";function i(o){l=o,f(1,l)}return a.$$set=o=>{"data"in o&&f(0,r=o.data)},[r,l,t,s,i]}class Xe extends He{constructor(e){super(),Ee(this,e,Fe,ze,we,{data:0})}}export{Xe as component};
