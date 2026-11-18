import React,{useEffect,useRef,useState} from 'react';
import {X,Check,Move,ZoomIn} from 'lucide-react';
import {renderCrop,exportCrop,cropGeometry} from '../utils/cropImage';

// Browser canvas editor; exports a JPEG File for the existing Cloudinary uploader.
// Cropping remote Cloudinary photos requires the image delivery URL to allow CORS.
export default function PhotoCropModal({source,onCancel,onApply}){
  const canvas=useRef(null);
  const drag=useRef(null);
  const [image,setImage]=useState(null);
  const [aspect,setAspect]=useState(1);
  const [zoom,setZoom]=useState(1);
  const [offset,setOffset]=useState({x:0,y:0});
  const [error,setError]=useState('');
  const [busy,setBusy]=useState(false);
  useEffect(()=>{
    let active=true; const img=new Image();
    img.crossOrigin='anonymous';
    img.onload=()=>{if(active){setImage(img);setError('');}};
    img.onerror=()=>{if(active)setError('Could not load this photo. Try replacing it with a local photo.');};
    img.src=source;
    return()=>{active=false;};
  },[source]);
  useEffect(()=>{
    if(!image||!canvas.current)return;
    try{renderCrop(canvas.current,image,aspect,zoom,offset);}catch(err){setError(err.message);}
  },[image,aspect,zoom,offset]);
  const pointerDown=e=>{
    if(!image)return;
    canvas.current.setPointerCapture(e.pointerId);
    drag.current={x:e.clientX,y:e.clientY};
  };
  const pointerMove=e=>{
    if(!drag.current||!image||!canvas.current)return;
    const rect=canvas.current.getBoundingClientRect();
    const dx=(e.clientX-drag.current.x)*(canvas.current.width/rect.width);
    const dy=(e.clientY-drag.current.y)*(canvas.current.height/rect.height);
    drag.current={x:e.clientX,y:e.clientY};
    setOffset(prev=>{
      const geom=cropGeometry(image,canvas.current.width,canvas.current.height,zoom,prev);
      return {x:Math.max(-geom.maxX,Math.min(geom.maxX,prev.x+dx)),y:Math.max(-geom.maxY,Math.min(geom.maxY,prev.y+dy))};
    });
  };
  const pointerUp=()=>{drag.current=null;};
  const apply=async()=>{
    if(!image||busy)return;
    setBusy(true);setError('');
    try{const file=await exportCrop(canvas.current);onApply(file);}catch(err){setError(err.message||'Unable to crop this image.');setBusy(false);}
  };
  return <div className="crop-backdrop" onMouseDown={e=>{if(e.target===e.currentTarget&&!busy)onCancel();}}>
    <div className="crop-dialog" role="dialog" aria-modal="true" aria-label="Crop post photo">
      <div className="crop-header"><div><h3>Crop your photo</h3><small>Drag to reposition • zoom • pick a shape</small></div><button aria-label="Close crop editor" type="button" disabled={busy} onClick={onCancel}><X size={20}/></button></div>
      <div className="crop-stage" aria-label="Image crop preview">
        {!image&&!error&&<span>Loading photo…</span>}
        <canvas ref={canvas} onPointerDown={pointerDown} onPointerMove={pointerMove} onPointerUp={pointerUp} onPointerCancel={pointerUp} style={{display:image?'block':'none'}} aria-label="Drag the photo to change the crop"/>
      </div>
      <div className="crop-body">
        <label className="crop-zoom" htmlFor="circle-photo-zoom"><ZoomIn size={17}/> Zoom <input id="circle-photo-zoom" type="range" min="1" max="3" step="0.01" value={zoom} disabled={!image} onChange={e=>setZoom(Number(e.target.value))}/><span>{Math.round(zoom*100)}%</span></label>
        <div className="crop-aspects"><span>Shape</span>{[{value:1,label:'1:1 Square'},{value:4/5,label:'4:5 Portrait'},{value:16/9,label:'16:9 Wide'}].map(x=><button key={x.label} type="button" className={aspect===x.value?'chosen':''} onClick={()=>{setAspect(x.value);setOffset({x:0,y:0});setZoom(1)}}>{x.label}</button>)}</div>
        <div className="crop-help"><Move size={15}/> The photo stays centered until you drag or zoom.</div>
        {error&&<p className="crop-error" role="alert">{error}</p>}
        <div className="crop-actions"><button type="button" className="secondary" disabled={busy} onClick={onCancel}>Cancel</button><button type="button" className="primary" disabled={!image||busy} onClick={apply}><Check size={16}/>{busy?'Processing…':'Apply crop'}</button></div>
      </div>
    </div>
  </div>;
}
