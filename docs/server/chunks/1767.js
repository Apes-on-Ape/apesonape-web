"use strict";exports.id=1767,exports.ids=[1767],exports.modules={91767:(t,e,r)=>{r.r(e),r.d(e,{PhCheck:()=>n}),r(95892);var a=r(82353),l=r(63318),o=r(74309),i=r(29600),s=r(82136),h=Object.defineProperty,p=Object.getOwnPropertyDescriptor,d=(t,e,r,a)=>{for(var l,o=a>1?void 0:a?p(e,r):e,i=t.length-1;i>=0;i--)(l=t[i])&&(o=(a?l(e,r,o):l(o))||o);return a&&o&&h(e,r,o),o};let n=class extends l.WF{constructor(){super(...arguments),this.size="1em",this.weight="regular",this.color="currentColor",this.mirrored=!1}render(){var t;return(0,a.qy)`<svg
      xmlns="http://www.w3.org/2000/svg"
      width="${this.size}"
      height="${this.size}"
      fill="${this.color}"
      viewBox="0 0 256 256"
      transform=${this.mirrored?"scale(-1, 1)":null}
    >
      ${n.weightsMap.get(null!=(t=this.weight)?t:"regular")}
    </svg>`}};n.weightsMap=new Map([["thin",(0,a.JW)`<path d="M226.83,74.83l-128,128a4,4,0,0,1-5.66,0l-56-56a4,4,0,0,1,5.66-5.66L96,194.34,221.17,69.17a4,4,0,1,1,5.66,5.66Z"/>`],["light",(0,a.JW)`<path d="M228.24,76.24l-128,128a6,6,0,0,1-8.48,0l-56-56a6,6,0,0,1,8.48-8.48L96,191.51,219.76,67.76a6,6,0,0,1,8.48,8.48Z"/>`],["regular",(0,a.JW)`<path d="M229.66,77.66l-128,128a8,8,0,0,1-11.32,0l-56-56a8,8,0,0,1,11.32-11.32L96,188.69,218.34,66.34a8,8,0,0,1,11.32,11.32Z"/>`],["bold",(0,a.JW)`<path d="M232.49,80.49l-128,128a12,12,0,0,1-17,0l-56-56a12,12,0,1,1,17-17L96,183,215.51,63.51a12,12,0,0,1,17,17Z"/>`],["fill",(0,a.JW)`<path d="M216,40H40A16,16,0,0,0,24,56V200a16,16,0,0,0,16,16H216a16,16,0,0,0,16-16V56A16,16,0,0,0,216,40ZM205.66,85.66l-96,96a8,8,0,0,1-11.32,0l-40-40a8,8,0,0,1,11.32-11.32L104,164.69l90.34-90.35a8,8,0,0,1,11.32,11.32Z"/>`],["duotone",(0,a.JW)`<path d="M232,56V200a16,16,0,0,1-16,16H40a16,16,0,0,1-16-16V56A16,16,0,0,1,40,40H216A16,16,0,0,1,232,56Z" opacity="0.2"/><path d="M205.66,85.66l-96,96a8,8,0,0,1-11.32,0l-40-40a8,8,0,0,1,11.32-11.32L104,164.69l90.34-90.35a8,8,0,0,1,11.32,11.32Z"/>`]]),n.styles=(0,s.AH)`
    :host {
      display: contents;
    }
  `,d([(0,i.M)({type:String,reflect:!0})],n.prototype,"size",2),d([(0,i.M)({type:String,reflect:!0})],n.prototype,"weight",2),d([(0,i.M)({type:String,reflect:!0})],n.prototype,"color",2),d([(0,i.M)({type:Boolean,reflect:!0})],n.prototype,"mirrored",2),n=d([(0,o.E)("ph-check")],n)}};