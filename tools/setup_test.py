import asyncio, json
from playwright.async_api import async_playwright
async def main():
    async with async_playwright() as p:
        b = await p.chromium.launch(executable_path='/usr/bin/google-chrome'); pg = await b.new_page(viewport={'width':1600,'height':900})
        await pg.goto('file:///home/claude/ett101sim/dist/index.html'); await pg.wait_for_timeout(500)
        for n in ['Exp1-AM-Modulation','Exp2-DSBSC-Modulation','Exp3-AM-Demodulation']:
            # load through the real "Open setup" file input
            await pg.set_input_files('#fileIn', f'setups/{n}.ett.json'); await pg.wait_for_timeout(1500)
            r = await pg.evaluate("""(()=>{const sc=window.__app.scope; const m1=sc.measure('CH1'), m2=sc.measure('CH2');
              const f=(m)=>m?{Vpp:+m.Vpp.toFixed(3),Vavg:+m.Vavg.toFixed(3),Freq:Math.round(m.Freq)}:null;
              return {leads:window.__app.sim.leads.length, adderDC:null, CH1:f(m1), CH2:f(m2), status:sc.status}})()""")
            print(n, json.dumps(r))
            await pg.screenshot(path=f'/tmp/claude-0/-home-claude/7769ccca-1829-53e2-911f-c6071462c562/scratchpad/shots/{n}.png')
        await b.close()
asyncio.run(main())
