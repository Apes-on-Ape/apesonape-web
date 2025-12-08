"use strict";exports.id=4326,exports.ids=[4326],exports.modules={64326:(t,e,r)=>{r.r(e),r.d(e,{PhCopy:()=>l}),r(95892);var a=r(82353),H=r(63318),V=r(74309),o=r(29600),i=r(82136),s=Object.defineProperty,h=Object.getOwnPropertyDescriptor,p=(t,e,r,a)=>{for(var H,V=a>1?void 0:a?h(e,r):e,o=t.length-1;o>=0;o--)(H=t[o])&&(V=(a?H(e,r,V):H(V))||V);return a&&V&&s(e,r,V),V};let l=class extends H.WF{constructor(){super(...arguments),this.size="1em",this.weight="regular",this.color="currentColor",this.mirrored=!1}render(){var t;return(0,a.qy)`<svg
      xmlns="http://www.w3.org/2000/svg"
      width="${this.size}"
      height="${this.size}"
      fill="${this.color}"
      viewBox="0 0 256 256"
      transform=${this.mirrored?"scale(-1, 1)":null}
    >
      ${l.weightsMap.get(null!=(t=this.weight)?t:"regular")}
    </svg>`}};l.weightsMap=new Map([["thin",(0,a.JW)`<path d="M216,36H88a4,4,0,0,0-4,4V84H40a4,4,0,0,0-4,4V216a4,4,0,0,0,4,4H168a4,4,0,0,0,4-4V172h44a4,4,0,0,0,4-4V40A4,4,0,0,0,216,36ZM164,212H44V92H164Zm48-48H172V88a4,4,0,0,0-4-4H92V44H212Z"/>`],["light",(0,a.JW)`<path d="M216,34H88a6,6,0,0,0-6,6V82H40a6,6,0,0,0-6,6V216a6,6,0,0,0,6,6H168a6,6,0,0,0,6-6V174h42a6,6,0,0,0,6-6V40A6,6,0,0,0,216,34ZM162,210H46V94H162Zm48-48H174V88a6,6,0,0,0-6-6H94V46H210Z"/>`],["regular",(0,a.JW)`<path d="M216,32H88a8,8,0,0,0-8,8V80H40a8,8,0,0,0-8,8V216a8,8,0,0,0,8,8H168a8,8,0,0,0,8-8V176h40a8,8,0,0,0,8-8V40A8,8,0,0,0,216,32ZM160,208H48V96H160Zm48-48H176V88a8,8,0,0,0-8-8H96V48H208Z"/>`],["bold",(0,a.JW)`<path d="M216,28H88A12,12,0,0,0,76,40V76H40A12,12,0,0,0,28,88V216a12,12,0,0,0,12,12H168a12,12,0,0,0,12-12V180h36a12,12,0,0,0,12-12V40A12,12,0,0,0,216,28ZM156,204H52V100H156Zm48-48H180V88a12,12,0,0,0-12-12H100V52H204Z"/>`],["fill",(0,a.JW)`<path d="M216,32H88a8,8,0,0,0-8,8V80H40a8,8,0,0,0-8,8V216a8,8,0,0,0,8,8H168a8,8,0,0,0,8-8V176h40a8,8,0,0,0,8-8V40A8,8,0,0,0,216,32Zm-8,128H176V88a8,8,0,0,0-8-8H96V48H208Z"/>`],["duotone",(0,a.JW)`<path d="M216,40V168H168V88H88V40Z" opacity="0.2"/><path d="M216,32H88a8,8,0,0,0-8,8V80H40a8,8,0,0,0-8,8V216a8,8,0,0,0,8,8H168a8,8,0,0,0,8-8V176h40a8,8,0,0,0,8-8V40A8,8,0,0,0,216,32ZM160,208H48V96H160Zm48-48H176V88a8,8,0,0,0-8-8H96V48H208Z"/>`]]),l.styles=(0,i.AH)`
    :host {
      display: contents;
    }
  `,p([(0,o.M)({type:String,reflect:!0})],l.prototype,"size",2),p([(0,o.M)({type:String,reflect:!0})],l.prototype,"weight",2),p([(0,o.M)({type:String,reflect:!0})],l.prototype,"color",2),p([(0,o.M)({type:Boolean,reflect:!0})],l.prototype,"mirrored",2),l=p([(0,V.E)("ph-copy")],l)}};