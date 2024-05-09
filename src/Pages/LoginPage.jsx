import { signInWithEmailAndPassword } from 'firebase/auth';
import React, { useState } from 'react'
import toast, { Toaster } from 'react-hot-toast'
import { Link, useNavigate } from 'react-router-dom';
import { auth } from '../firebase';
import Loader from '../Components/Loader';
import { motion } from 'framer-motion';

function LoginPage() {

    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [loading, setLoading] = useState(false);
    const [error, setErr] = useState(null);
    const navigate = useNavigate();

    const handleSignIn = async (e) => {
        e.preventDefault();
        setLoading(true);

        try {
            // Sign in with email and password
            await signInWithEmailAndPassword(auth, email, password);
            toast.success('Logged in successfully!');
            // Clear form fields
            setEmail('');
            setPassword('');
            setLoading(false);
            setErr(false); // Reset error state
            navigate('/'); // Navigate to the desired route after successful login
        } catch (error) {
            console.error('Error logging in:', error.message);
            // Show error message
            toast.error(error.message);
            setErr(true);
            setLoading(false);
        }
    }


    return (
        <>
            {loading ? ( // Conditionally render Loader component when loading is true
                <Loader text={'Trying to Login'} />
            ) : (
                <>
                    <Toaster position='top-center' /><div className="mx-auto w-full px-4 py-16 sm:px-6 lg:px-8 min-h-screen bg-zinc-950 flex flex-col items-center justify-center">
                        <div className="mx-auto max-w-md text-center">
                            <motion.h1
                                whileInView={{ opacity: 1, y: 0 }}
                                initial={{ opacity: 0, y: 20 }}
                                transition={{ delay: 0, duration: 0.5 }}
                                className="text-2xl font-black sm:text-3xl text-teal-500">Welcome Back Buddy!</motion.h1>

                            <motion.p
                                whileInView={{ opacity: 1, y: 0 }}
                                initial={{ opacity: 0, y: 20 }}
                                transition={{ delay: 0.2, duration: 0.5 }}
                                className="mt-4 text-zinc-200">
                                Login to your account to continue helping others and get benifited by others.
                            </motion.p>
                        </div>
                        <form
                            className="mx-auto mb-0 mt-8 max-w-md space-y-4 w-full"
                            onSubmit={handleSignIn}>
                            <motion.div
                                whileInView={{ opacity: 1, y: 0 }}
                                initial={{ opacity: 0, y: 20 }}
                                transition={{ delay: 0.4, duration: 0.5 }}
                            >
                                <label className="sr-only">Email</label>
                                <input
                                    className="bg-zinc-900 text-white placeholder:text-zinc-300 w-full rounded-lg border-2 border-zinc-700 p-4 pe-12 text-sm shadow-sm"
                                    type="email"
                                    value={email}
                                    onChange={(e) => setEmail(e.target.value)}
                                    placeholder="Email"
                                    required />
                            </motion.div>
                            <motion.div
                                whileInView={{ opacity: 1, y: 0 }}
                                initial={{ opacity: 0, y: 20 }}
                                transition={{ delay: 0.6, duration: 0.5 }}
                            >
                                <label className="sr-only">Password</label>
                                <input
                                    className="bg-zinc-900 text-white placeholder:text-zinc-300 w-full rounded-lg border-2 border-zinc-700 p-4 pe-12 text-sm shadow-sm"
                                    placeholder="Password"
                                    type="password"
                                    value={password}
                                    onChange={(e) => setPassword(e.target.value)}
                                    required />
                            </motion.div>

                            <div className="flex flex-col gap-4 items-center justify-between">
                                <motion.button
                                    whileInView={{ opacity: 1, y: 0 }}
                                    initial={{ opacity: 0, y: 20 }}
                                    transition={{ delay: 0.8, duration: 0.5 }}
                                    type="submit"
                                    className="w-full inline-block rounded-lg bg-teal-500 px-8 py-3 text-sm font-medium text-white"
                                >
                                    Sign In
                                </motion.button>
                                <motion.p
                                    whileInView={{ opacity: 1, y: 0 }}
                                    initial={{ opacity: 0, y: 20 }}
                                    transition={{ delay: 1, duration: 0.5 }}
                                    className="text-sm text-zinc-500">
                                    Don't have an account ?
                                    <Link className="hover:underline" to={'/signup'}> Sign Up</Link>
                                </motion.p>
                            </div>
                        </form>
                    </div>
                </>
            )}
        </>
    )
}

export default LoginPage
