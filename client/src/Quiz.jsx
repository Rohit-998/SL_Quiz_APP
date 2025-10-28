import React, { useEffect, useState, useRef } from "react";
import { Button } from "./components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "./components/ui/card";
import { motion, AnimatePresence } from "framer-motion";
import gsap from "gsap";

const API_BASE = "https://sl-quiz-app.onrender.com/api";

const categories = {
  Technical: ["java", "c", "python"],
  "Non-Technical": ["gk"],
};

export default function Quiz() {
  const [stage, setStage] = useState("home");
  const [selectedMain, setSelectedMain] = useState(null);
  const [selectedCategory, setSelectedCategory] = useState(null);
  const [questions, setQuestions] = useState([]);
  const [current, setCurrent] = useState(0);
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);
  const [showNext, setShowNext] = useState(false);
  const [statsImg, setStatsImg] = useState(null);
  const containerRef = useRef();

  useEffect(() => {
    gsap.fromTo(
      containerRef.current,
      { opacity: 0, y: 50 },
      { opacity: 1, y: 0, duration: 0.8, ease: "power3.out" }
    );
  }, [stage]);

  const fetchQuestions = async (category) => {
    setLoading(true);
    try {
      const res = await fetch(`${API_BASE}/questions?category=${category}`);
      const data = await res.json();
      setQuestions(data);
      setStage("quiz");
    } catch {
      alert("Error fetching questions");
    }
    setLoading(false);
  };

  const handleAnswer = async (option) => {
    const q = questions[current];
    const res = await fetch(`${API_BASE}/submit`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        category: selectedCategory,
        question_id: q.id,
        user_answer: option,
      }),
    });
    const data = await res.json();
    setResult(data.message);
    setShowNext(true);
  };

  const handleNext = () => {
    setResult(null);
    setShowNext(false);
    if (current + 1 < questions.length) setCurrent((prev) => prev + 1);
    else setStage("end");
  };

  const handleShowStats = async () => {
    const res = await fetch(`${API_BASE}/stats?category=${selectedCategory}`);
    const blob = await res.blob();
    setStatsImg(URL.createObjectURL(blob));
    setStage("stats");
  };

  return (
    <div
      ref={containerRef}
      className="min-h-screen flex flex-col items-center justify-center bg-gradient-to-br from-purple-900 via-purple-800 to-indigo-900 text-white p-6"
    >
      <AnimatePresence mode="wait">
        {stage === "home" && (
          <motion.div
            key="home"
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            transition={{ duration: 0.5 }}
            className="w-full max-w-lg"
          >
            <Card className="bg-purple-800/50 text-center p-6 rounded-2xl border border-purple-500/30 shadow-lg">
              <CardHeader>
                <CardTitle className="text-3xl font-bold text-purple-200 mb-4">
                  Choose Your Path
                </CardTitle>
              </CardHeader>
              <CardContent className="flex flex-col gap-4">
                {Object.keys(categories).map((main) => (
                  <Button
                    key={main}
                    onClick={() => {
                      setSelectedMain(main);
                      setStage("subcategory");
                    }}
                    className="bg-purple-600 hover:bg-purple-700 text-lg py-6 rounded-xl"
                  >
                    {main}
                  </Button>
                ))}
              </CardContent>
            </Card>
          </motion.div>
        )}

        {stage === "subcategory" && (
          <motion.div
            key="subcategory"
            initial={{ opacity: 0, x: 50 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -50 }}
            transition={{ duration: 0.6 }}
            className="w-full max-w-lg"
          >
            <Card className="bg-purple-800/50 text-center p-6 rounded-2xl border border-purple-500/30 shadow-lg">
              <CardHeader>
                <CardTitle className="text-2xl text-purple-200 mb-4">
                  {selectedMain} Categories
                </CardTitle>
              </CardHeader>
              <CardContent className="flex flex-col gap-4">
                {categories[selectedMain].map((cat) => (
                  <Button
                    key={cat}
                    onClick={() => {
                      setSelectedCategory(cat);
                      fetchQuestions(cat);
                    }}
                    className="bg-purple-600 hover:bg-purple-700 py-4 text-lg rounded-xl"
                    disabled={loading}
                  >
                    {cat.toUpperCase()}
                  </Button>
                ))}
                <Button
                  variant="outline"
                  className="text-purple-300 hover:bg-purple-700/40"
                  onClick={() => setStage("home")}
                >
                  ← Back
                </Button>
              </CardContent>
            </Card>
          </motion.div>
        )}

        {stage === "quiz" && questions.length > 0 && (
          <motion.div
            key="quiz"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.6 }}
            className="w-full max-w-lg"
          >
            <Card className="bg-purple-800/50 border border-purple-600/40 p-6 rounded-2xl shadow-lg">
              <CardHeader>
                <CardTitle className="text-xl text-purple-200 mb-4">
                  Q{current + 1}: {questions[current].question}
                </CardTitle>
              </CardHeader>
              <CardContent className="flex flex-col gap-3">
                {questions[current].options.map((opt, i) => (
                  <Button
                    key={i}
                    onClick={() => handleAnswer(opt)}
                    disabled={!!result}
                    className={`py-3 text-lg rounded-lg transition-all ${
                      result && opt === questions[current].answer
                        ? "bg-green-500"
                        : "bg-purple-600 hover:bg-purple-700"
                    }`}
                  >
                    {opt}
                  </Button>
                ))}
                {result && (
                  <motion.p
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    className="text-purple-100 mt-3 font-medium"
                  >
                    {result}
                  </motion.p>
                )}
                {showNext && (
                  <Button
                    onClick={handleNext}
                    className="mt-4 bg-indigo-500 hover:bg-indigo-600 rounded-lg"
                  >
                    Next →
                  </Button>
                )}
              </CardContent>
            </Card>
          </motion.div>
        )}

        {stage === "end" && (
          <motion.div
            key="end"
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.6 }}
            className="w-full max-w-md"
          >
            <Card className="bg-purple-800/50 border border-purple-600/40 p-6 text-center rounded-2xl shadow-lg">
              <CardHeader>
                <CardTitle className="text-2xl text-purple-200 mb-4">
                  🎉 Quiz Completed!
                </CardTitle>
              </CardHeader>
              <CardContent className="flex flex-col gap-3">
                <Button
                  onClick={handleShowStats}
                  className="bg-indigo-500 hover:bg-indigo-600"
                >
                  View My Stats
                </Button>
                <Button
                  className="bg-purple-600 hover:bg-purple-700"
                  onClick={() => {
                    setStage("home");
                    setCurrent(0);
                    setQuestions([]);
                  }}
                >
                  Try Again
                </Button>
              </CardContent>
            </Card>
          </motion.div>
        )}

        {stage === "stats" && statsImg && (
          <motion.div
            key="stats"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.8 }}
            className="text-center"
          >
            <h2 className="text-3xl font-semibold mb-4">📊 Your Performance</h2>
            <img src={statsImg} alt="Stats" className="mx-auto rounded-xl shadow-lg" />
            <Button
              className="mt-6 bg-purple-600 hover:bg-purple-700"
              onClick={() => setStage("home")}
            >
              Back to Home
            </Button>
          </motion.div>
        )}
        
      </AnimatePresence>
      <footer>
        <p className="text-sm text-purple-300 mt-6">
          Made By Rohit Agrawal. Bhoomi Batra. Rohit Mhaski. Marmika Kirnapure
        </p>
      </footer>
    </div>
  );
}
