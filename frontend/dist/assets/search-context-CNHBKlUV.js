import{b as g,p as f,R as i,j as e}from"./index-Bfe_xoWe.js";import{m as k,g as C,h as M,i as S,j as p,k as c,l as w}from"./command-BxhSYefj.js";import{c as D}from"./createLucideIcon-D4fp6AvF.js";import{c as l}from"./createReactComponent-C46LlQ4r.js";import{S as L}from"./scroll-area-DT3SgYon.js";import{O as N,P as I}from"./dropdown-menu-_kFiOKFk.js";/**
 * @license @tabler/icons-react v3.31.0 - MIT
 *
 * This source code is licensed under the MIT license.
 * See the LICENSE file in the root directory of this source tree.
 */var u=l("outline","arrow-right-dashed","IconArrowRightDashed",[["path",{d:"M5 12h.5m3 0h1.5m3 0h6",key:"svg-0"}],["path",{d:"M13 18l6 -6",key:"svg-1"}],["path",{d:"M13 6l6 6",key:"svg-2"}]]);/**
 * @license @tabler/icons-react v3.31.0 - MIT
 *
 * This source code is licensed under the MIT license.
 * See the LICENSE file in the root directory of this source tree.
 */var R=l("outline","device-laptop","IconDeviceLaptop",[["path",{d:"M3 19l18 0",key:"svg-0"}],["path",{d:"M5 6m0 1a1 1 0 0 1 1 -1h12a1 1 0 0 1 1 1v8a1 1 0 0 1 -1 1h-12a1 1 0 0 1 -1 -1z",key:"svg-1"}]]);/**
 * @license @tabler/icons-react v3.31.0 - MIT
 *
 * This source code is licensed under the MIT license.
 * See the LICENSE file in the root directory of this source tree.
 */var A=l("outline","help","IconHelp",[["path",{d:"M12 12m-9 0a9 9 0 1 0 18 0a9 9 0 1 0 -18 0",key:"svg-0"}],["path",{d:"M12 17l0 .01",key:"svg-1"}],["path",{d:"M12 13.5a1.5 1.5 0 0 1 1 -1.5a2.6 2.6 0 1 0 -3 -4",key:"svg-2"}]]);/**
 * @license @tabler/icons-react v3.31.0 - MIT
 *
 * This source code is licensed under the MIT license.
 * See the LICENSE file in the root directory of this source tree.
 */var v=l("outline","layout-dashboard","IconLayoutDashboard",[["path",{d:"M5 4h4a1 1 0 0 1 1 1v6a1 1 0 0 1 -1 1h-4a1 1 0 0 1 -1 -1v-6a1 1 0 0 1 1 -1",key:"svg-0"}],["path",{d:"M5 16h4a1 1 0 0 1 1 1v2a1 1 0 0 1 -1 1h-4a1 1 0 0 1 -1 -1v-2a1 1 0 0 1 1 -1",key:"svg-1"}],["path",{d:"M15 12h4a1 1 0 0 1 1 1v6a1 1 0 0 1 -1 1h-4a1 1 0 0 1 -1 -1v-6a1 1 0 0 1 1 -1",key:"svg-2"}],["path",{d:"M15 4h4a1 1 0 0 1 1 1v2a1 1 0 0 1 -1 1h-4a1 1 0 0 1 -1 -1v-2a1 1 0 0 1 1 -1",key:"svg-3"}]]);/**
 * @license @tabler/icons-react v3.31.0 - MIT
 *
 * This source code is licensed under the MIT license.
 * See the LICENSE file in the root directory of this source tree.
 */var E=l("outline","users","IconUsers",[["path",{d:"M9 7m-4 0a4 4 0 1 0 8 0a4 4 0 1 0 -8 0",key:"svg-0"}],["path",{d:"M3 21v-2a4 4 0 0 1 4 -4h4a4 4 0 0 1 4 4v2",key:"svg-1"}],["path",{d:"M16 3.13a4 4 0 0 1 0 7.75",key:"svg-2"}],["path",{d:"M21 21v-2a4 4 0 0 0 -3 -3.85",key:"svg-3"}]]);/**
 * @license lucide-react v0.488.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */const b=[["path",{d:"M15 6v12a3 3 0 1 0 3-3H6a3 3 0 1 0 3 3V6a3 3 0 1 0-3 3h12a3 3 0 1 0-3-3",key:"11bfej"}]],O=D("command",b),G={user:{name:"Admin",email:"admin@gmail.com",avatar:"/avatars/shadcn.jpg"},teams:[{name:"Admin",logo:O,plan:"Admin"}],navGroups:[{title:"General",items:[{title:"Investments",url:"/investments",icon:v},{title:"Finances",url:"/finances",icon:v},{title:"Records",url:"/records",icon:E}]},{title:"Other",items:[{title:"Help Center",url:"/help-center",icon:A}]}]};function H(){const t=g(),{setTheme:o}=f(),{open:d,setOpen:n}=P(),a=i.useCallback(s=>{n(!1),s()},[n]);return e.jsxs(k,{modal:!0,open:d,onOpenChange:n,children:[e.jsx(C,{placeholder:"Type a command or search..."}),e.jsx(M,{children:e.jsxs(L,{type:"hover",className:"h-72 pr-1",children:[e.jsx(S,{children:"No results found."}),G.navGroups.map(s=>e.jsx(p,{heading:s.title,children:s.items.map((r,j)=>{var m;return r.url?e.jsxs(c,{value:r.title,onSelect:()=>{a(()=>t({to:r.url}))},children:[e.jsx("div",{className:"mr-2 flex h-4 w-4 items-center justify-center",children:e.jsx(u,{className:"text-muted-foreground/80 size-2"})}),r.title]},`${r.url}-${j}`):(m=r.items)==null?void 0:m.map((h,y)=>e.jsxs(c,{value:h.title,onSelect:()=>{a(()=>t({to:h.url}))},children:[e.jsx("div",{className:"mr-2 flex h-4 w-4 items-center justify-center",children:e.jsx(u,{className:"text-muted-foreground/80 size-2"})}),h.title]},`${h.url}-${y}`))})},s.title)),e.jsx(w,{}),e.jsxs(p,{heading:"Theme",children:[e.jsxs(c,{onSelect:()=>a(()=>o("light")),children:[e.jsx(N,{})," ",e.jsx("span",{children:"Light"})]}),e.jsxs(c,{onSelect:()=>a(()=>o("dark")),children:[e.jsx(I,{className:"scale-90"}),e.jsx("span",{children:"Dark"})]}),e.jsxs(c,{onSelect:()=>a(()=>o("system")),children:[e.jsx(R,{}),e.jsx("span",{children:"System"})]})]})]})})]})}const x=i.createContext(null);function F({children:t}){const[o,d]=i.useState(!1);return i.useEffect(()=>{const n=a=>{a.key==="k"&&(a.metaKey||a.ctrlKey)&&(a.preventDefault(),d(s=>!s))};return document.addEventListener("keydown",n),()=>document.removeEventListener("keydown",n)},[]),e.jsxs(x.Provider,{value:{open:o,setOpen:d},children:[t,e.jsx(H,{})]})}const P=()=>{const t=i.useContext(x);if(!t)throw new Error("useSearch has to be used within <SearchContext.Provider>");return t};export{F as S,G as s,P as u};
