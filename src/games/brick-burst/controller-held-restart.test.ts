import { expect, it, vi } from 'vitest'
import { BrickBurstController } from './controller'
import { fakeObserver, recordingContext } from './test-support'

it('keeps held steering when restart enters serving from playing or serving', () => {
  const canvas=document.createElement('canvas'), container=document.createElement('div')
  container.append(canvas)
  vi.spyOn(canvas,'getContext').mockReturnValue(recordingContext().context)
  const controller=new BrickBurstController(canvas,container,()=>{}, {
    seed:41,requestFrame:()=>1,cancelFrame:()=>{},createResizeObserver:fakeObserver,
    reducedMotion:()=>false,devicePixelRatio:()=>1,
  })
  try {
    window.dispatchEvent(new KeyboardEvent('keydown',{key:'ArrowLeft'}))
    controller.dispatch({type:'serve'});controller.dispatch({type:'restart'})
    expect(controller.getState().steer).toBe(-1)
    controller.dispatch({type:'restart'})
    expect(controller.getState().steer).toBe(-1)
    window.dispatchEvent(new KeyboardEvent('keyup',{key:'ArrowLeft'}))
    expect(controller.getState().steer).toBe(0)
  } finally { controller.destroy();vi.restoreAllMocks() }
})
