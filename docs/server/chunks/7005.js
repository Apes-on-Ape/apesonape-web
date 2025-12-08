"use strict";exports.id=7005,exports.ids=[7005],exports.modules={57005:(t,e,r)=>{r.r(e),r.d(e,{PhCaretLeft:()=>n}),r(95892);var l=r(82353),o=r(63318),a=r(74309),i=r(29600),s=r(82136),p=Object.defineProperty,h=Object.getOwnPropertyDescriptor,d=(t,e,r,l)=>{for(var o,a=l>1?void 0:l?h(e,r):e,i=t.length-1;i>=0;i--)(o=t[i])&&(a=(l?o(e,r,a):o(a))||a);return l&&a&&p(e,r,a),a};let n=class extends o.WF{constructor(){super(...arguments),this.size="1em",this.weight="regular",this.color="currentColor",this.mirrored=!1}render(){var t;return(0,l.qy)`<svg
      xmlns="http://www.w3.org/2000/svg"
      width="${this.size}"
      height="${this.size}"
      fill="${this.color}"
      viewBox="0 0 256 256"
      transform=${this.mirrored?"scale(-1, 1)":null}
    >
      ${n.weightsMap.get(null!=(t=this.weight)?t:"regular")}
    </svg>`}};n.weightsMap=new Map([["thin",(0,l.JW)`<path d="M162.83,205.17a4,4,0,0,1-5.66,5.66l-80-80a4,4,0,0,1,0-5.66l80-80a4,4,0,1,1,5.66,5.66L85.66,128Z"/>`],["light",(0,l.JW)`<path d="M164.24,203.76a6,6,0,1,1-8.48,8.48l-80-80a6,6,0,0,1,0-8.48l80-80a6,6,0,0,1,8.48,8.48L88.49,128Z"/>`],["regular",(0,l.JW)`<path d="M165.66,202.34a8,8,0,0,1-11.32,11.32l-80-80a8,8,0,0,1,0-11.32l80-80a8,8,0,0,1,11.32,11.32L91.31,128Z"/>`],["bold",(0,l.JW)`<path d="M168.49,199.51a12,12,0,0,1-17,17l-80-80a12,12,0,0,1,0-17l80-80a12,12,0,0,1,17,17L97,128Z"/>`],["fill",(0,l.JW)`<path d="M168,48V208a8,8,0,0,1-13.66,5.66l-80-80a8,8,0,0,1,0-11.32l80-80A8,8,0,0,1,168,48Z"/>`],["duotone",(0,l.JW)`<path d="M160,48V208L80,128Z" opacity="0.2"/><path d="M163.06,40.61a8,8,0,0,0-8.72,1.73l-80,80a8,8,0,0,0,0,11.32l80,80A8,8,0,0,0,168,208V48A8,8,0,0,0,163.06,40.61ZM152,188.69,91.31,128,152,67.31Z"/>`]]),n.styles=(0,s.AH)`
    :host {
      display: contents;
    }
  `,d([(0,i.M)({type:String,reflect:!0})],n.prototype,"size",2),d([(0,i.M)({type:String,reflect:!0})],n.prototype,"weight",2),d([(0,i.M)({type:String,reflect:!0})],n.prototype,"color",2),d([(0,i.M)({type:Boolean,reflect:!0})],n.prototype,"mirrored",2),n=d([(0,a.E)("ph-caret-left")],n)}};