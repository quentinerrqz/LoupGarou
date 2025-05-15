import React, { memo } from 'react'
import Chronos from './Chronos'
import IsNight from './IsNight'
import ActualAction from './actualAction'

const TableInfo = memo(function TableInfo(){
  return (
    <div className='absolute top-0 z-40 flex justify-center items-center'>
        <div className='bg-white rounded-lg shadow-lg p-4'>
            <Chronos />
            <IsNight />
            <ActualAction />
            </div>
    </div>
  )
})

export default TableInfo