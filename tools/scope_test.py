import asyncio, math
from playwright.async_api import async_playwright
async def main():
    async with async_playwright() as p:
        b = await p.chromium.launch(executable_path='/usr/bin/google-chrome')
        pg = await b.new_page(viewport={'width':1600,'height':900})
        logs=[]; pg.on('pageerror', lambda e: logs.append('PAGEERROR: '+str(e)))
        await pg.goto('file:///home/claude/ett101sim/dist/index.html'); await pg.wait_for_timeout(600)
        await pg.evaluate(open('tools/am.js').read()); await pg.evaluate("window.__app.setView('scope')"); await pg.wait_for_timeout(700)
        st = lambda: pg.evaluate("(()=>{const s=window.__app.scope.st;return JSON.stringify({td:s.td,h:+s.hpos.toExponential(2),run:s.run,vpos:s.ch[s.sel].pos,frozen:!!window.__app.scope.frozen, W:window.__app.scope.view&&Math.round(window.__app.scope.view.W)})})()")
        knobs = await pg.evaluate("[...document.querySelectorAll('.sknob')].map(k=>{const r=k.getBoundingClientRect();return [r.x+r.width/2,r.y+r.height/2,r.width]})")
        print('start', await st(), 'knob sizes', [round(k[2]) for k in knobs])
        x,y,_ = knobs[5]  # tscale: drag sideways right (clockwise = faster? scale knob: clockwise -> smaller t/div)
        await pg.mouse.move(x,y); await pg.mouse.down(); await pg.mouse.move(x+70,y,steps=10); await pg.mouse.up(); print('tscale sideways right', await st())
        # circular drag around tscale knob, counter-clockwise half circle
        R=45; await pg.mouse.move(x+R,y); await pg.mouse.down()
        for k in range(0,19): a=-k*10*math.pi/180; await pg.mouse.move(x+R*math.cos(a), y+R*math.sin(a))
        await pg.mouse.up(); print('tscale circle ccw 180deg', await st())
        x,y,_ = knobs[2]; await pg.mouse.move(x,y); await pg.mouse.down(); await pg.mouse.move(x+80,y,steps=10); await pg.mouse.up(); print('hpos right', await st())
        rb = await pg.evaluate("""(()=>{const g=[...document.querySelectorAll('.sbtn')].find(e=>e.textContent==='RUN/STOP');const r=g.getBoundingClientRect();return [r.x+r.width/2,r.y+r.height/2]})()""")
        await pg.mouse.click(*rb); await pg.wait_for_timeout(200); print('stopped', await st())
        x,y,_ = knobs[5]; await pg.mouse.move(x,y); await pg.mouse.wheel(0,-100); await pg.wait_for_timeout(150); await pg.mouse.wheel(0,-100); await pg.wait_for_timeout(300); print('tscale wheel up x2 while stopped', await st())
        await pg.screenshot(path='/tmp/claude-0/-home-claude/7769ccca-1829-53e2-911f-c6071462c562/scratchpad/shots/stopped.png')
        x,y,_ = knobs[1]; await pg.mouse.move(x,y); await pg.mouse.down(); await pg.mouse.move(x,y-60,steps=8); await pg.mouse.up(); print('vpos up', await st())
        print(logs[:5]); await b.close()
asyncio.run(main())
