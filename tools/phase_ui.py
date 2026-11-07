import asyncio
from playwright.async_api import async_playwright
JS = """(()=>{const sc=window.__app.scope; const a=sc.frame.CH1, b=sc.frame.CH2; const n=a.y.length;
 const env=new Float64Array(n); for(let i=0;i<n;i++) env[i]=b.hi?b.hi[i]-b.lo[i]:Math.abs(b.y[i]);
 const m=Array.from(a.y), ma=m.reduce((x,v)=>x+v,0)/n, me=env.reduce((x,v)=>x+v,0)/n; let c=0,p=0,q=0;
 for(let i=0;i<n;i++){c+=(m[i]-ma)*(env[i]-me);p+=(m[i]-ma)**2;q+=(env[i]-me)**2;}
 return {VDC: window.__app.sim.mods.vdc.volts(), corr: +(c/Math.sqrt(p*q)).toFixed(3), toast: document.getElementById('toast').textContent}})()"""
async def main():
    async with async_playwright() as p:
        b = await p.chromium.launch(executable_path='/usr/bin/google-chrome'); pg = await b.new_page(viewport={'width':1600,'height':900})
        await pg.goto('file:///home/claude/ett101sim/dist/index.html'); await pg.wait_for_timeout(500)
        await pg.set_input_files('#fileIn', 'setups/Exp1-AM-Modulation-v2.ett.json'); await pg.wait_for_timeout(1200)
        print('as loaded       ', await pg.evaluate(JS))
        await pg.evaluate("window.__app.scope.st.hpos=-200e-6; window.__app.scope.st.ch.CH1.vd=9"); await pg.wait_for_timeout(800)
        print('your scope view ', await pg.evaluate(JS))
        await pg.evaluate("window.__app.sim.mods.vdc.set('VDC',0.3); window.__app.panel.refreshAll()"); await pg.wait_for_timeout(800)
        print('old file (VDC -1)', await pg.evaluate(JS))
        await b.close()
asyncio.run(main())
