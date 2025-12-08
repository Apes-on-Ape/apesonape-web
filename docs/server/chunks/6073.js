"use strict";exports.id=6073,exports.ids=[6073],exports.modules={36073:(t,e,r)=>{r.r(e),r.d(e,{PhCaretUp:()=>n}),r(95892);var l=r(82353),o=r(63318),a=r(74309),i=r(29600),s=r(82136),p=Object.defineProperty,h=Object.getOwnPropertyDescriptor,d=(t,e,r,l)=>{for(var o,a=l>1?void 0:l?h(e,r):e,i=t.length-1;i>=0;i--)(o=t[i])&&(a=(l?o(e,r,a):o(a))||a);return l&&a&&p(e,r,a),a};let n=class extends o.WF{constructor(){super(...arguments),this.size="1em",this.weight="regular",this.color="currentColor",this.mirrored=!1}render(){var t;return(0,l.qy)`<svg
      xmlns="http://www.w3.org/2000/svg"
      width="${this.size}"
      height="${this.size}"
      fill="${this.color}"
      viewBox="0 0 256 256"
      transform=${this.mirrored?"scale(-1, 1)":null}
    >
      ${n.weightsMap.get(null!=(t=this.weight)?t:"regular")}
    </svg>`}};n.weightsMap=new Map([["thin",(0,l.JW)`<path d="M210.83,162.83a4,4,0,0,1-5.66,0L128,85.66,50.83,162.83a4,4,0,0,1-5.66-5.66l80-80a4,4,0,0,1,5.66,0l80,80A4,4,0,0,1,210.83,162.83Z"/>`],["light",(0,l.JW)`<path d="M212.24,164.24a6,6,0,0,1-8.48,0L128,88.49,52.24,164.24a6,6,0,0,1-8.48-8.48l80-80a6,6,0,0,1,8.48,0l80,80A6,6,0,0,1,212.24,164.24Z"/>`],["regular",(0,l.JW)`<path d="M213.66,165.66a8,8,0,0,1-11.32,0L128,91.31,53.66,165.66a8,8,0,0,1-11.32-11.32l80-80a8,8,0,0,1,11.32,0l80,80A8,8,0,0,1,213.66,165.66Z"/>`],["bold",(0,l.JW)`<path d="M216.49,168.49a12,12,0,0,1-17,0L128,97,56.49,168.49a12,12,0,0,1-17-17l80-80a12,12,0,0,1,17,0l80,80A12,12,0,0,1,216.49,168.49Z"/>`],["fill",(0,l.JW)`<path d="M215.39,163.06A8,8,0,0,1,208,168H48a8,8,0,0,1-5.66-13.66l80-80a8,8,0,0,1,11.32,0l80,80A8,8,0,0,1,215.39,163.06Z"/>`],["duotone",(0,l.JW)`<path d="M208,160H48l80-80Z" opacity="0.2"/><path d="M213.66,154.34l-80-80a8,8,0,0,0-11.32,0l-80,80A8,8,0,0,0,48,168H208a8,8,0,0,0,5.66-13.66ZM67.31,152,128,91.31,188.69,152Z"/>`]]),n.styles=(0,s.AH)`
    :host {
      display: contents;
    }
  `,d([(0,i.M)({type:String,reflect:!0})],n.prototype,"size",2),d([(0,i.M)({type:String,reflect:!0})],n.prototype,"weight",2),d([(0,i.M)({type:String,reflect:!0})],n.prototype,"color",2),d([(0,i.M)({type:Boolean,reflect:!0})],n.prototype,"mirrored",2),n=d([(0,a.E)("ph-caret-up")],n)}};