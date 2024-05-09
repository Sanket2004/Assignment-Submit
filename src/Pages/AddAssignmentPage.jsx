import React, { useState } from 'react'
import { auth, db, storage } from '../firebase';
import { getDownloadURL, ref, uploadBytes } from 'firebase/storage';
import { collection, doc, setDoc } from 'firebase/firestore';
import { useNavigate } from 'react-router-dom';
import toast, { Toaster } from 'react-hot-toast';
import Loader from '../Components/Loader';
import { motion } from 'framer-motion';


function AddAssignmentPage() {

    const [selectedFile, setSelectedFile] = useState(null);
    const [assignmentTitle, setAssignmentTitle] = useState('');
    const [subject, setSubject] = useState('');
    const [assignmentDetails, setAssignmentDetails] = useState('');
    const [loading, setLoading] = useState(false);


    const navigate = useNavigate();

    const handleFileChange = (e) => {
        const file = e.target.files[0];
        setSelectedFile(file);
    };

    const handleSubmit = async (e) => {
        setLoading(true);
        e.preventDefault();
        try {
            // Upload file to Firebase Storage
            const fileRef = ref(storage, `assignments/${auth.currentUser.uid}/${selectedFile.name}`);
            await uploadBytes(fileRef, selectedFile);

            // Get download URL of the uploaded file
            const fileURL = await getDownloadURL(fileRef);

            // Add assignment details to Firestore with auto-generated document ID
            const assignmentsCollectionRef = collection(db, 'assignments'); // Reference to the "assignments" collection
            const newAssignmentRef = doc(assignmentsCollectionRef); // Generate new document reference within the "assignments" collection
            await setDoc(newAssignmentRef, {
                title: assignmentTitle,
                subject: subject,
                details: assignmentDetails,
                fileURL: fileURL,
                createdBy: auth.currentUser.uid,
                createdAt: new Date(),
            });
            setLoading(false);
            navigate('/')
        } catch (error) {
            toast.error("Error adding assignment !");
        }


        // Reset form fields
        setSelectedFile(null);
        setAssignmentTitle('');
        setSubject('');
        setAssignmentDetails('');
    };



    return (
        <>
            <Toaster />
            {loading ? (
                <Loader text={"Adding Assignment !"} />
            ) : (
                <div className="mx-auto px-4 py-16 sm:px-6 lg:px-8 min-h-screen bg-zinc-950 text-white flex flex-col items-center justify-center">
                    <div className="mx-auto w-full max-w-screen-lg text-center">
                        <i className="ri-arrow-left-s-line bg-teal-500 h-10 w-10 flex items-center justify-center flex-0 cursor-pointer rounded mb-4" onClick={() => navigate(-1)}></i>
                        <div className="mx-auto max-w-lg text-center">
                            <motion.h1
                                whileInView={{ opacity: 1, y: 0 }}
                                initial={{ opacity: 0, y: 20 }}
                                transition={{ delay: 0, duration: 0.5 }}
                                className="text-2xl font-black sm:text-3xl text-teal-500">Add Assignment</motion.h1>
                            <motion.p
                                whileInView={{ opacity: 1, y: 0 }}
                                initial={{ opacity: 0, y: 20 }}
                                transition={{ delay: 0.2, duration: 0.5 }}
                                className="mt-4 text-zinc-400">
                                Add current assignment which is currently given in the class.
                            </motion.p>
                        </div>
                    </div>

                    <form onSubmit={handleSubmit} className="mx-auto mb-0 mt-8 max-w-lg space-y-4 w-full">
                        <motion.div
                            whileInView={{ opacity: 1, y: 0 }}
                            initial={{ opacity: 0, y: 20 }}
                            transition={{ delay: 0.4, duration: 0.5 }}
                            className="flex items-center justify-center">
                            <label htmlFor="file-input" className="text-sm flex flex-row items-center bg-zinc-900 hover:bg-zinc-800 text-white py-4 px-4 rounded-lg cursor-pointer w-full border-2 border-zinc-700">
                                <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4v16m8-8H4"></path>
                                </svg>
                                {selectedFile ?
                                    <span>{selectedFile.name}</span> :
                                    <span>Attach Assignment <span className='text-teal-400'>*</span></span>
                                }
                                <input
                                    id="file-input"
                                    className="hidden"
                                    type="file"
                                    accept=".pdf,.doc,.docx,.txt,.png,.jpeg,.jpg"
                                    onChange={handleFileChange}
                                    required
                                />
                            </label>
                        </motion.div>


                        <motion.div
                            whileInView={{ opacity: 1, y: 0 }}
                            initial={{ opacity: 0, y: 20 }}
                            transition={{ delay: 0.6, duration: 0.5 }}
                        >
                            <label className="sr-only">Assignment Title</label>
                            <input
                                className="bg-zinc-900 text-white placeholder:text-zinc-300 w-full rounded-lg border-2 border-zinc-700 p-4 pe-12 text-sm shadow-sm"
                                type="text"
                                value={assignmentTitle}
                                onChange={(e) => setAssignmentTitle(e.target.value)}
                                placeholder="Assignment Title"
                                required
                            />
                        </motion.div>

                        <motion.div
                            whileInView={{ opacity: 1, y: 0 }}
                            initial={{ opacity: 0, y: 20 }}
                            transition={{ delay: 0.8, duration: 0.5 }}
                        >
                            <label className="sr-only">Subject</label>
                            <input
                                className="bg-zinc-900 text-white placeholder:text-zinc-300 w-full rounded-lg border-2 border-zinc-700 p-4 pe-12 text-sm shadow-sm"
                                type="text"
                                value={subject}
                                onChange={(e) => setSubject(e.target.value)}
                                placeholder="Subject"
                                required
                            />
                        </motion.div>


                        <motion.div
                            whileInView={{ opacity: 1, y: 0 }}
                            initial={{ opacity: 0, y: 20 }}
                            transition={{ delay: 1, duration: 0.5 }}
                        >
                            <label className="sr-only">Assignment Details</label>
                            <textarea
                                className="resize-none bg-zinc-900 text-white placeholder:text-zinc-300 w-full rounded-lg border-2 border-zinc-700 p-4 pe-12 text-sm shadow-sm h-40"
                                type="text"
                                value={assignmentDetails}
                                onChange={(e) => setAssignmentDetails(e.target.value)}
                                placeholder="Assignment Deatils"
                                required
                            />
                        </motion.div>



                        <motion.div
                            whileInView={{ opacity: 1, y: 0 }}
                            initial={{ opacity: 0, y: 20 }}
                            transition={{ delay: 1.2, duration: 0.5 }}
                            className="flex items-center justify-end">
                            <button
                                type="submit"
                                className="w-full inline-block rounded-lg bg-teal-500 px-5 py-3 text-sm font-medium text-white"
                            >
                                Submit
                            </button>
                        </motion.div>
                    </form>
                </div>
            )
            }
        </>

    )
}

export default AddAssignmentPage
