// Centered, cover-style crop geometry. Offsets are in canvas pixels.
export function cropGeometry(image, width, height, zoom, offset) {
  const coverScale=Math.max(width/image.naturalWidth,height/image.naturalHeight);
  const drawWidth=image.naturalWidth*coverScale*zoom;
  const drawHeight=image.naturalHeight*coverScale*zoom;
  const maxX=Math.max(0,(drawWidth-width)/2);
  const maxY=Math.max(0,(drawHeight-height)/2);
  const x=Math.max(-maxX,Math.min(maxX,offset.x));
  const y=Math.max(-maxY,Math.min(maxY,offset.y));
  return {drawWidth,drawHeight,x,y,maxX,maxY};
}
export function renderCrop(canvas,image,aspect,zoom,offset) {
  const width=720;
  const height=Math.round(width/aspect);
  if(canvas.width!==width)canvas.width=width;
  if(canvas.height!==height)canvas.height=height;
  const context=canvas.getContext('2d');
  if(!context)throw new Error('This browser cannot create image previews.');
  context.clearRect(0,0,width,height);
  const geom=cropGeometry(image,width,height,zoom,offset);
  context.imageSmoothingEnabled=true;
  context.imageSmoothingQuality='high';
  context.drawImage(image,(width-geom.drawWidth)/2+geom.x,(height-geom.drawHeight)/2+geom.y,geom.drawWidth,geom.drawHeight);
  return geom;
}
export async function exportCrop(canvas) {
  const blob=await new Promise((resolve,reject)=>{
    try {canvas.toBlob(data=>data?resolve(data):reject(new Error('Could not save this crop.')), 'image/jpeg',.88);}
    catch {reject(new Error('Your photo host does not allow browser cropping. Replace it with a photo from your device.'));}
  });
  return new File([blob],`circle-cropped-${Date.now()}.jpg`,{type:'image/jpeg'});
}
