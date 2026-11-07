import asyncio
from playwright.async_api import async_playwright
OUT='/tmp/claude-0/-home-claude/7769ccca-1829-53e2-911f-c6071462c562/scratchpad/shots/'
async def center(pg, sel):
    return await pg.evaluate(f"""(()=>{{const r=document.querySelector('{sel}').getBoundingClientRect();return [r.x+r.width/2,r.y+r.height/2];}})()""")
async def main():
    async with async_playwright() as p:
        b = await p.chromium.launch(executable_path='/usr/bin/google-chrome', args=['--autoplay-policy=no-user-gesture-required','--use-fake-ui-for-media-stream','--use-fake-device-for-media-stream'])
        pg = await b.new_page(viewport={'width':1920,'height':1040})
        logs=[]; pg.on('console', lambda m: logs.append(m.type+': '+m.text)); pg.on('pageerror', lambda e: logs.append('PAGEERROR: '+str(e)))
        await pg.goto('file:///home/claude/ett101sim/dist/index.html'); await pg.wait_for_timeout(800)
        await pg.evaluate("window.__app.wires.clearAll()")
        async def drag(a, bsel):
            x1,y1 = await center(pg, a); x2,y2 = await center(pg, bsel)
            await pg.mouse.move(x1,y1); await pg.mouse.down(); await pg.mouse.move((x1+x2)/2,(y1+y2)/2, steps=5); await pg.mouse.move(x2,y2, steps=5); await pg.mouse.up()
        # DSBSC by mouse
        await drag('[data-socket="master.SINE2"] .sockHit', '[data-socket="mult1.XDC"] .sockHit')
        await drag('[data-socket="master.SINE100"] .sockHit', '[data-socket="mult1.YDC"] .sockHit')
        await drag('[data-bnc="CH1"]', '[data-socket="master.SINE2"]')
        await drag('[data-bnc="CH2"]', '[data-socket="mult1.KXY"]')
        print('leads', await pg.evaluate("window.__sim.leads.map(l=>l.a+'->'+l.b)"), 'probes', await pg.evaluate("JSON.stringify(window.__sim.probes)"))
        # stack a second lead on the same socket
        await drag('[data-socket="master.SINE2"]', '[data-socket="buffer.IN"]')
        print('stack ok', await pg.evaluate("window.__sim.leads.length"))
        # knob drag (buffer gain)
        x,y = await center(pg, '.knob[data-mod="buffer"]'); before = await pg.evaluate("window.__sim.mods.buffer.p.GAIN")
        await pg.mouse.move(x,y); await pg.mouse.down(); await pg.mouse.move(x,y-60, steps=6); 
        tip = await pg.evaluate("document.getElementById('tip').innerText")
        await pg.mouse.up(); after = await pg.evaluate("window.__sim.mods.buffer.p.GAIN"); print('knob', before, '->', after, 'tip:', tip)
        # AUTO button on scope
        bx = await pg.evaluate("""(()=>{const g=[...document.querySelectorAll('.sbtn')].find(e=>e.textContent==='AUTO');const r=g.getBoundingClientRect();return [r.x+r.width/2,r.y+r.height/2]})()""")
        await pg.mouse.click(*bx); await pg.wait_for_timeout(600)
        print('after AUTO td', await pg.evaluate("window.__app.scope.st.td"), 'vd', await pg.evaluate("[window.__app.scope.st.ch.CH1.vd, window.__app.scope.st.ch.CH2.vd]"))
        # hover a socket for meter
        x,y = await center(pg, '[data-socket="mult1.KXY"] .sockHit'); await pg.mouse.move(x+1,y+1); await pg.wait_for_timeout(400); await pg.mouse.move(x,y); await pg.wait_for_timeout(200)
        print('hover tip:', await pg.evaluate("document.getElementById('tip').innerText"))
        await pg.screenshot(path=OUT+'ui.png')
        # open info modal
        await pg.mouse.click(*(await center(pg, '.infoBtn[data-mod="mult1"]'))); await pg.wait_for_timeout(300)
        await pg.screenshot(path=OUT+'modal.png'); await pg.keyboard.press('Escape')
        # guide
        await pg.click('#btnGuide'); await pg.click('.expBtn[data-e="exp2"]'); await pg.wait_for_timeout(1500)
        await pg.screenshot(path=OUT+'guide.png')
        for l in logs[:20]: print(l)
        await b.close()
asyncio.run(main())
