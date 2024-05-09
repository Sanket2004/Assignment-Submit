import React from 'react'

function Loader({text}) {
    return (
        <div className="w-full h-screen bg-zinc-950 text-white flex items-center justify-center">
            <h1 className='font-black text-xl animate-bounce'>{text}</h1>
        </div>
    )
}

export default Loader
