import { useNavigate, useParams } from 'react-router-dom';
import { collection, doc, getDoc, addDoc, serverTimestamp, collectionGroup, getDocs, deleteDoc, updateDoc, increment, setDoc, runTransaction } from 'firebase/firestore';
import { auth, db, storage } from '../firebase';
import { useEffect, useState } from 'react';
import toast, { Toaster } from 'react-hot-toast';
import { deleteObject, getDownloadURL, ref, uploadBytes } from 'firebase/storage';
import Loader from '../Components/Loader';
import { motion } from 'framer-motion';

function AssignmentDetailsPage() {
    const { id } = useParams();
    const [assignment, setAssignment] = useState(null);
    const [creator, setCreator] = useState(null);
    const [answer, setAnswer] = useState('');
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [answers, setAnswers] = useState([]);
    const [selectedFile, setSelectedFile] = useState(null);
    const [assignmentTitle, setAssignmentTitle] = useState('');
    const [assignmentDetails, setAssignmentDetails] = useState('');
    const [loading, setLoading] = useState(true); // State to manage loading status
    const navigate = useNavigate();

    const handleFileChange = (e) => {
        const file = e.target.files[0];
        setSelectedFile(file);
    };

    // Function to toggle modal open/close
    const toggleModal = () => {
        setIsModalOpen(!isModalOpen);
    };

    // Effect to add/remove class on body based on modal state
    useEffect(() => {
        if (isModalOpen) {
            document.body.classList.add('overflow-hidden');
        } else {
            document.body.classList.remove('overflow-hidden');
        }
    }, [isModalOpen]);

    const fetchAnswers = async () => {
        // Check if user is authenticated
        if (auth.currentUser) {
            setLoading(true);
            try {
                const answersQuerySnapshot = await getDocs(collection(db, `assignments/${id}/answers`));
                const fetchedAnswers = answersQuerySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
                setAnswers(fetchedAnswers);
                setLoading(false);
            } catch (error) {
                setLoading(false);
                console.error('Error fetching answers:', error.message);
                toast.error('Error fetching answers');
            }
        }
    };

    useEffect(() => {
        const fetchAssignment = async () => {
            // Check if user is authenticated
            if (auth.currentUser) {
                setLoading(true);
                try {
                    const assignmentRef = doc(db, 'assignments', id);
                    const assignmentSnapshot = await getDoc(assignmentRef);
                    if (assignmentSnapshot.exists()) {
                        const assignmentData = { id: assignmentSnapshot.id, ...assignmentSnapshot.data() };
                        setAssignment(assignmentData);
                        // Fetch creator details
                        const creatorData = await getCreatorDetails(assignmentData.createdBy);
                        console.log('Creator Data:', creatorData); // Log creator data for debugging
                        if (creatorData) {
                            setCreator(creatorData);
                            console.log('Creator State:', creator); // Log creator state after setting
                        } else {
                            console.log(`Creator details not found for createdBy: ${assignmentData.createdBy}`);
                        }
                    } else {
                        toast.error('Assignment not found');
                    }
                    setLoading(false);
                } catch (error) {
                    setLoading(false);
                    console.error('Error fetching assignment:', error.message);
                    toast.error('Error fetching assignment');
                }
            }
        };



        const getCreatorDetails = async (uid) => {
            setLoading(true);
            try {
                const userDoc = await getDoc(doc(db, 'users', uid));
                setLoading(false)
                return userDoc.exists() ? userDoc.data() : null;
            } catch (error) {
                console.error('Error fetching creator details:', error.message);
                setLoading(false)
                return null;
            }
        };

        fetchAssignment();
        fetchAnswers(); // Initial fetch of answers

        // Cleanup function
        return () => {
            // Cleanup if necessary
        };
    }, [id]);

    const handleSubmitAnswer = async (e) => {
        e.preventDefault();
        setLoading(true);
        try {
            // Get current user details
            const currentUser = auth.currentUser;
            if (!currentUser) {
                throw new Error('User not logged in');
            }
            const { uid, email } = currentUser;

            // Fetch profile picture URL from Firestore
            const userDocRef = doc(db, 'users', uid);
            const userDocSnap = await getDoc(userDocRef);
            const profilePicUrl = userDocSnap.data().profilePicUrl;
            const displayName = userDocSnap.data().name;

            // Prepare data to be submitted
            const data = {
                answer,
                createdAt: serverTimestamp(),
                userId: uid, // Add user ID who submitted the answer
                user: {
                    displayName,
                    email,
                    profilePicUrl, // Include profile picture URL
                    // You can include more user details here if needed
                },
                votes: 0, // Initialize votes count to 0
            };

            // If a file is attached, upload it to Firebase Storage
            if (selectedFile) {
                const storageRef = ref(storage, `assignment-answers/${id}/${selectedFile.name}`);
                await uploadBytes(storageRef, selectedFile);
                const fileDownloadURL = await getDownloadURL(storageRef);
                data.fileDownloadURL = fileDownloadURL; // Add file download URL to the data
            }

            // Add answer to the subcollection 'answers' under the assignment document
            await addDoc(collection(db, `assignments/${id}/answers`), data);
            toast.success('Answer submitted successfully');
            setAnswer('');
            setSelectedFile(null); // Reset selected file after submission

            // After adding the answer, refetch the answers
            fetchAnswers();
            toggleModal(); // Close the modal after submission
            setLoading(false);
        } catch (error) {
            setLoading(false);
            console.error('Error submitting answer:', error.message);
            toast.error('Error submitting answer');
        }
    };


    // if (!assignment) {
    //     setLoading(true);
    // }



    const handleDeleteAnswer = async (answerId, fileDownloadURL) => {
        if (!window.confirm('Are you sure you want to delete this answer?')) {
            return;
        }
        setLoading(true);
        try {
            // Delete the answer document from Firestore
            const answerDocRef = doc(db, `assignments/${id}/answers`, answerId);
            await deleteDoc(answerDocRef);

            // Delete the "voted" subcollection associated with the answer
            const votedCollectionRef = collection(db, `assignments/${id}/answers/${answerId}/voted`);
            const votedDocs = await getDocs(votedCollectionRef);
            votedDocs.forEach(async (doc) => {
                await deleteDoc(doc.ref);
            });

            // If a file was attached, delete it from Firebase Storage
            if (fileDownloadURL) {
                const fileRef = ref(storage, fileDownloadURL);
                await deleteObject(fileRef);
            }

            // Fetch the updated list of answers
            fetchAnswers();
            toast.success('Answer deleted successfully');
        } catch (error) {
            console.error('Error deleting answer:', error.message);
            toast.error('Error deleting answer');
        } finally {
            setLoading(false);
        }
    };



    const [votedAnswers, setVotedAnswers] = useState({});

    // Function to handle voting for an answer
    const handleVote = async (answerId) => {
        try {
            // Check if the user has already voted for this answer
            if (votedAnswers[answerId]) {
                toast.error("You've already voted for this answer.");
                return;
            }

            // Update the vote count for the answer in Firestore
            const answerRef = doc(db, `assignments/${id}/answers`, answerId);
            await runTransaction(db, async (transaction) => {


                // Check if the user has already voted for this answer
                const votedRef = collection(db, `assignments/${id}/answers/${answerId}/voted`);
                const votedSnapshot = await getDocs(votedRef);
                const votedUsers = votedSnapshot.docs.map(doc => doc.id);


                if (votedUsers.includes(auth.currentUser.uid)) {
                    toast.error("You've already voted for this answer.");
                    return;
                }
                const answerDoc = await transaction.get(answerRef);
                if (!answerDoc.exists()) {
                    throw new Error("Answer document does not exist");
                }
                const newVotes = (answerDoc.data().votes || 0) + 1;
                transaction.update(answerRef, { votes: newVotes });

                // Store user's vote in Firestore
                await setDoc(doc(db, `assignments/${id}/answers/${answerId}/voted`, auth.currentUser.uid), { voted: true });

                toast.success('You have successfully voted.');
            });

            // Update the votedAnswers state to indicate that the user has voted for this answer
            setVotedAnswers(prevState => ({ ...prevState, [answerId]: true }));

            // Update the local state with the updated answer data
            setAnswers(prevAnswers =>
                prevAnswers.map(answer =>
                    answer.id === answerId ? { ...answer, votes: (answer.votes || 0) + 1 } : answer
                )
            );
        } catch (error) {
            console.error('Error voting for answer:', error.message);
            toast.error('Error voting for answer');
        }
    };


    useEffect(() => {
        // Check if the current user has already voted for each answer
        const checkIfVoted = async () => {
            const promises = answers.map(async answer => {
                const votedRef = collection(db, `assignments/${id}/answers/${answer.id}/voted`);
                const votedSnapshot = await getDocs(votedRef);
                const votedUsers = votedSnapshot.docs.map(doc => doc.id);
                return { [answer.id]: votedUsers.includes(auth.currentUser.uid) };
            });
            const results = await Promise.all(promises);
            const votedAnswersMap = Object.assign({}, ...results);
            setVotedAnswers(votedAnswersMap);
        };
        checkIfVoted();
    }, [answers]);








    return (
        <>
            <Toaster />
            {loading && ( // Conditionally render Loader component when loading is true
                <Loader text={'Loading Assignment'} />)}
            {assignment && (
                <>
                    <button className='fixed h-10 w-max bg-teal-500 bottom-8 right-8 text-white rounded px-4 shadow-xl text-sm' onClick={toggleModal}><i className="ri-add-line"></i> Add Answer</button><div className="mx-auto w-full min-h-screen px-4 py-20 sm:px-6 lg:px-8 bg-zinc-950 text-white">
                        <div className="mx-auto max-w-screen-xl">
                            <i className="ri-arrow-left-s-line bg-teal-500 h-10 w-10 flex items-center justify-center flex-0 cursor-pointer rounded mb-8" onClick={() => navigate(-1)}></i>
                            {/* <div className="flex flex-row items-center gap-4 mb-4">
                                <h2 className='text-l sm:text-xl font-bold text-white'>
                                    Assignment Details
                                </h2>
                            </div> */}

                            <motion.div
                                whileInView={{ opacity: 1, y: 0 }}
                                initial={{ opacity: 0, y: 20 }}
                                transition={{ delay: 0, duration: 0.5 }}
                                className="rounded border-b-4 border-teal-500 overflow-hidden">
                                {creator ? <div className="min-h-24 bg-zinc-900 to-50% relative">
                                    <div className="flex flex-col justify-center px-6 pt-6">
                                        <h2 className='text-2xl sm:text-3xl font-black text-teal-500 text-wrap whitespace-pre-wrap' style={{ lineBreak: "auto", wordWrap: "break-word" }}>{assignment.title}</h2>
                                        <p className='text-base max-h-60 overflow-auto mt-2 font-bold'>Subject - {assignment.subject || "Unknown"}</p>
                                        <div className="flex flex-row items-center justify-start gap-2 mt-4">
                                            <img src={creator.profilePicUrl} className='object-cover w-10 h-10 rounded-full' />
                                            <div className="flex flex-col items-start justify-center">
                                                <p className='font-semibold'>{creator.name || "Anonymous"}</p>
                                                <p className='text-sm'><i className="ri-calendar-line"></i> {new Date(assignment.createdAt.seconds * 1000).toLocaleString()}</p>
                                            </div>
                                        </div>
                                    </div>
                                </div> :
                                    <div className="flex items-center justify-center w-full h-28">
                                        <i className="ri-loader-4-fill animate-spin text-2xl text-white"></i>
                                    </div>
                                }

                                <div className="p-6 bg-zinc-900 to-50%">
                                    <p className='font-bold'>Description</p>
                                    <p className='text-base max-h-60 overflow-auto text-wrap break-words whitespace-break-spaces mt-2'>{assignment.details}</p>
                                    <a className=' mt-4 bg-zinc-900 px-3 py-2 rounded border-2 border-zinc-700 flex w-max gap-2 items-center justify-center h-10' href={assignment.fileURL} target="_blank" rel="noopener noreferrer">
                                        <i className="ri-file-text-line"></i>
                                        <p className='text-sm'> {assignment.title}</p>
                                    </a>

                                </div>
                            </motion.div>


                            {isModalOpen && (
                                <div className="fixed top-0 left-0 w-full h-screen flex items-center justify-center bg-black bg-opacity-50 z-50 backdrop-blur-md">
                                    <div className="bg-zinc-900 rounded-lg p-8 w-[90%] sm:w-[40rem] h-4/3">
                                        <motion.h3
                                            whileInView={{ opacity: 1, y: 0 }}
                                            initial={{ opacity: 0, y: 20 }}
                                            transition={{ delay: 0, duration: 0.5 }}
                                            className="text-xl font-black mb-4 text-teal-500">Add Answer</motion.h3>
                                        <form onSubmit={handleSubmitAnswer} className='flex flex-col gap-4'>
                                            <motion.div
                                                whileInView={{ opacity: 1, y: 0 }}
                                                initial={{ opacity: 0, y: 20 }}
                                                transition={{ delay: 0.2, duration: 0.5 }}
                                                className="flex flex-col items-start justify-center">
                                                <p className='text-sm mb-2'>Choose a file</p>
                                                <label htmlFor="file-input" className="text-sm flex flex-row items-center bg-zinc-900 hover:bg-zinc-800 text-white py-4 px-4 rounded cursor-pointer w-full border-2 border-zinc-700">
                                                    <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4v16m8-8H4"></path>
                                                    </svg>
                                                    {selectedFile ?
                                                        <span>{selectedFile.name}</span> :
                                                        <span>Attach Assignment</span>}
                                                    <input
                                                        id="file-input"
                                                        className="hidden"
                                                        type="file"
                                                        accept=".pdf,.doc,.docx"
                                                        onChange={handleFileChange} />
                                                </label>
                                            </motion.div>
                                            <motion.div
                                                whileInView={{ opacity: 1, y: 0 }}
                                                initial={{ opacity: 0, y: 20 }}
                                                transition={{ delay: 0.4, duration: 0.5 }}
                                                className="flex flex-col items-start justify-center">
                                                <p className='text-sm mb-2'>Add your answer or comment <span className='text-teal-400'>*</span></p>
                                                <textarea className='rounded bg-zinc-900 p-4 w-full h-36 resize-none border-2 border-zinc-700 mb-4 text-sm' value={answer} onChange={(e) => setAnswer(e.target.value)} placeholder="Enter your answer" required />
                                            </motion.div>
                                            <motion.div
                                                whileInView={{ opacity: 1, y: 0 }}
                                                initial={{ opacity: 0, y: 20 }}
                                                transition={{ delay: 0.6, duration: 0.5 }}
                                                className="flex justify-end">
                                                <button type="button" className="inline-block rounded bg-zinc-700 text-white px-4 py-2 mr-4 text-sm hover:bg-red-600 transition duration-300" onClick={toggleModal}>Cancel</button>
                                                <button type="submit" className="inline-block rounded bg-teal-500 text-white px-4 py-2 text-sm hover:bg-teal-600 transition duration-300">Submit Answer</button>
                                            </motion.div>
                                        </form>
                                    </div>
                                </div>
                            )}


                        </div>

                        <div className="rounded mt-8 mx-auto max-w-screen-xl">
                            <motion.h3
                                whileInView={{ opacity: 1, y: 0 }}
                                initial={{ opacity: 0, y: 20 }}
                                transition={{ delay: 0.2, duration: 0.5 }}
                                className='text-l sm:text-xl text-zinc-400 font-bold mb-4'>Discussion</motion.h3>
                            {answers.length === 0 ? (
                                <motion.p
                                    whileInView={{ opacity: 1, y: 0 }}
                                    initial={{ opacity: 0, y: 20 }}
                                    transition={{ delay: 0.5, duration: 0.5 }}
                                >No answers available</motion.p>
                            ) : (
                                <ul>
                                    {answers.map((answer) => (
                                        <motion.li
                                            whileInView={{ opacity: 1, y: 0 }}
                                            initial={{ opacity: 0, y: 20 }}
                                            transition={{ delay: 0.5, duration: 0.5 }}
                                            key={answer.id} className='bg-gradient-to-br from-teal-900 from-0% to-zinc-900 to-50% rounded mb-2 p-4 border-2 border-zinc-700'>
                                            <div className='flex flex-row gap-2 items-center my-2'>
                                                {answer.user.profilePicUrl && (
                                                    <img src={answer.user.profilePicUrl} alt="" className='object-cover h-10 w-10 rounded-full' />
                                                )}
                                                <div className="flex flex-col">
                                                    <p className='font-bold text-md'>{answer.user.displayName || "Unknown"}</p>
                                                    <p className='text-xs'>{new Date(answer.createdAt.seconds * 1000).toLocaleString()}</p>
                                                </div>
                                            </div>
                                            <p className='py-2 rounded text-wrap break-words whitespace-break-spaces'>{answer.answer}</p>
                                            {answer.fileDownloadURL != null ? <a className='text-teal-500 font-semibold' href={answer.fileDownloadURL}>Attached File</a> : ''}
                                            {answer.user && (
                                                <div className="flex flex-row justify-between items-center mt-2">
                                                    <div className='flex flex-row items-center justify-center gap-4'>
                                                        {/* Button to upvote an answer */}
                                                        {/* Vote button */}
                                                        <div className='flex flex-row items-center justify-center gap-4'>
                                                            <button onClick={() => handleVote(answer.id)} disabled={votedAnswers[answer.id]} className={votedAnswers[answer.id] ? "cursor-not-allowed" : "cursor-pointer"}>
                                                                {votedAnswers[answer.id] ? (
                                                                    <i className="ri-thumb-up-fill text-teal-500"></i>
                                                                ) : (
                                                                    <i className="ri-thumb-up-line"></i>
                                                                )}
                                                            </button>
                                                            {/* Display the vote count */}
                                                            <span className='text-sm'>{answer.votes || 0}</span>
                                                        </div>
                                                    </div>

                                                    {auth.currentUser.uid === answer.userId ? <button onClick={() => handleDeleteAnswer(answer.id, answer.fileDownloadURL)}><i className="ri-delete-bin-line text-teal-400"></i></button> : ""}
                                                </div>
                                            )}
                                        </motion.li>
                                    ))}
                                </ul>
                            )}
                        </div>


                    </div>
                </>
            )}
        </>
    );
}

export default AssignmentDetailsPage;
