import React, { memo } from 'react'
import useQuery from '../_Hooks/useQuery'
import { IParams } from '../lib/game/schema/ParamsRecord'

const IsNight = memo(function IsNight() {
    const params = useQuery("params") as IParams
    const {isDay} = params
    

  return (
    <div>
        <div className='absolute top-40 z-40 flex justify-center items-center'>
            <div className='bg-white rounded-lg shadow-lg p-4'>
                <h2 className='text-xl font-bold'>Is Night</h2>
                <p>{isDay ? "Day" : "Night"}</p>
            </div>
        </div>
    </div>
  )
})

export default IsNight