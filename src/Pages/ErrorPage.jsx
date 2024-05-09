import { motion } from 'framer-motion';
import React from 'react';
import { Link } from 'react-router-dom';

function ErrorPage() {
    return (
        <div className="grid h-screen place-content-center bg-zinc-950 px-4">
            <div className="text-center text-white flex flex-col justify-center items-center">
                <motion.h1
                    whileInView={{ opacity: 1, y: 0 }}
                    initial={{ opacity: 0, y: 20 }}
                    transition={{ delay: 0, duration: 0.5 }}
                    className="mt-6 text-2xl font-black sm:text-3xl">404 - Not Found</motion.h1>

                <motion.p
                    whileInView={{ opacity: 1, y: 0 }}
                    initial={{ opacity: 0, y: 20 }}
                    transition={{ delay: 0.2, duration: 0.5 }}
                    className="mt-4 text-zinc-400">Sorry, the page you are looking for is not available.</motion.p>

                <Link to="/" ><motion.button
                whileInView={{ opacity: 1, y: 0 }}
                initial={{ opacity: 0, y: 20 }}
                transition={{ delay: 0.4, duration: 0.5 }}
                className="mt-4 bg-teal-500 text-white px-4 py-2 rounded shadow-md">Go to Home</motion.button></Link>
            </div>
        </div>

    );
}



export default ErrorPage;
