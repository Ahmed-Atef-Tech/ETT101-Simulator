import asyncio
from playwright.async_api import async_playwright
async def main():
    async with async_playwright() as p:
        b = await p.chromium.launch(executable_path='/usr/bin/google-chrome'); pg = await b.new_page(viewport={'width':1600,'height':900})
        await pg.goto('file:///home/claude/ett101sim/dist/index.html'); await pg.wait_for_timeout(500)
        await pg.evaluate("window.__app.sim.setHeadphones(false)")
        c = lambda: pg.evaluate("(()=>{const r=document.querySelector('.hpjack').getBoundingClientRect();return [r.x+r.width/2,r.y+r.height/2]})()")
        hp = lambda: pg.evaluate("window.__app.sim.headphones")
        x,y = await c(); await pg.mouse.click(x,y); await pg.wait_for_timeout(100); print('plug ->', await hp())
        await pg.mouse.click(x,y); await pg.wait_for_timeout(100); print('click jack centre again ->', await hp())
        await pg.mouse.click(x,y); await pg.wait_for_timeout(100); print('replug ->', await hp())
        r = await pg.evaluate("(()=>{const r=document.querySelector('.hpProp').getBoundingClientRect();return [r.x+r.width*0.5,r.y+r.height*0.9]})()")
        await pg.mouse.click(*r); await pg.wait_for_timeout(100); print('click headphones prop ->', await hp())
        await b.close()
asyncio.run(main())
