"use strict";exports.id=5535,exports.ids=[5535],exports.modules={75535:(t,e,r)=>{r.r(e),r.d(e,{PhBrowser:()=>l}),r(95892);var o=r(82353),s=r(63318),a=r(74309),i=r(29600),p=r(82136),H=Object.defineProperty,V=Object.getOwnPropertyDescriptor,h=(t,e,r,o)=>{for(var s,a=o>1?void 0:o?V(e,r):e,i=t.length-1;i>=0;i--)(s=t[i])&&(a=(o?s(e,r,a):s(a))||a);return o&&a&&H(e,r,a),a};let l=class extends s.WF{constructor(){super(...arguments),this.size="1em",this.weight="regular",this.color="currentColor",this.mirrored=!1}render(){var t;return(0,o.qy)`<svg
      xmlns="http://www.w3.org/2000/svg"
      width="${this.size}"
      height="${this.size}"
      fill="${this.color}"
      viewBox="0 0 256 256"
      transform=${this.mirrored?"scale(-1, 1)":null}
    >
      ${l.weightsMap.get(null!=(t=this.weight)?t:"regular")}
    </svg>`}};l.weightsMap=new Map([["thin",(0,o.JW)`<path d="M216,44H40A12,12,0,0,0,28,56V200a12,12,0,0,0,12,12H216a12,12,0,0,0,12-12V56A12,12,0,0,0,216,44ZM40,52H216a4,4,0,0,1,4,4V92H36V56A4,4,0,0,1,40,52ZM216,204H40a4,4,0,0,1-4-4V100H220V200A4,4,0,0,1,216,204Z"/>`],["light",(0,o.JW)`<path d="M216,42H40A14,14,0,0,0,26,56V200a14,14,0,0,0,14,14H216a14,14,0,0,0,14-14V56A14,14,0,0,0,216,42ZM40,54H216a2,2,0,0,1,2,2V90H38V56A2,2,0,0,1,40,54ZM216,202H40a2,2,0,0,1-2-2V102H218v98A2,2,0,0,1,216,202Z"/>`],["regular",(0,o.JW)`<path d="M216,40H40A16,16,0,0,0,24,56V200a16,16,0,0,0,16,16H216a16,16,0,0,0,16-16V56A16,16,0,0,0,216,40Zm0,16V88H40V56Zm0,144H40V104H216v96Z"/>`],["bold",(0,o.JW)`<path d="M216,36H40A20,20,0,0,0,20,56V200a20,20,0,0,0,20,20H216a20,20,0,0,0,20-20V56A20,20,0,0,0,216,36Zm-4,24V84H44V60ZM44,196V108H212v88Z"/>`],["fill",(0,o.JW)`<path d="M216,40H40A16,16,0,0,0,24,56V200a16,16,0,0,0,16,16H216a16,16,0,0,0,16-16V56A16,16,0,0,0,216,40Zm0,16V88H40V56Z"/>`],["duotone",(0,o.JW)`<path d="M224,56V96H32V56a8,8,0,0,1,8-8H216A8,8,0,0,1,224,56Z" opacity="0.2"/><path d="M216,40H40A16,16,0,0,0,24,56V200a16,16,0,0,0,16,16H216a16,16,0,0,0,16-16V56A16,16,0,0,0,216,40Zm0,16V88H40V56Zm0,144H40V104H216v96Z"/>`]]),l.styles=(0,p.AH)`
    :host {
      display: contents;
    }
  `,h([(0,i.M)({type:String,reflect:!0})],l.prototype,"size",2),h([(0,i.M)({type:String,reflect:!0})],l.prototype,"weight",2),h([(0,i.M)({type:String,reflect:!0})],l.prototype,"color",2),h([(0,i.M)({type:Boolean,reflect:!0})],l.prototype,"mirrored",2),l=h([(0,a.E)("ph-browser")],l)}};