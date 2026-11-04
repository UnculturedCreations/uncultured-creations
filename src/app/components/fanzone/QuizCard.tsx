"use client"

import { useId, useRef, useState } from "react"
import { Check, X } from "lucide-react"
import type { Quiz } from "@/lib/realityReloaded"
import { focusRing } from "./ui"

// A quiz played entirely in the browser: one question at a time, instant feedback, final score.
export default function QuizCard({ quiz }: { quiz: Quiz }) {
  const groupId = useId()
  const [started, setStarted] = useState(false)
  const [index, setIndex] = useState(0)
  const [answer, setAnswer] = useState<string | null>(null)
  const [score, setScore] = useState(0)
  const [finished, setFinished] = useState(false)
  const headingRef = useRef<HTMLHeadingElement>(null)

  const question = quiz.questions[index]
  const total = quiz.questions.length
  const correctId = question?.options.find((o) => o.is_correct)?.id

  function choose(optionId: string) {
    if (answer) return
    setAnswer(optionId)
    if (optionId === correctId) setScore((s) => s + 1)
  }

  function next() {
    if (index + 1 >= total) setFinished(true)
    else {
      setIndex(index + 1)
      setAnswer(null)
    }
    // Move focus to the new question (or the score) for keyboard and screen-reader users.
    requestAnimationFrame(() => headingRef.current?.focus())
  }

  function restart() {
    setIndex(0)
    setAnswer(null)
    setScore(0)
    setFinished(false)
    requestAnimationFrame(() => headingRef.current?.focus())
  }

  const button = `rounded-lg bg-accent px-5 py-2.5 font-medium text-white ${focusRing}`

  return (
    <article className="rounded-2xl border border-contrast/10 bg-contrast/[0.03] p-5">
      <span className="text-xs text-contrast/65">Quiz · {total} {total === 1 ? "question" : "questions"}</span>

      {!started ? (
        <>
          <h3 className="mt-2 font-heading text-lg font-bold text-contrast">{quiz.title}</h3>
          {quiz.description && <p className="mt-2 text-sm text-contrast/75">{quiz.description}</p>}
          <button type="button" onClick={() => setStarted(true)} className={`mt-4 ${button}`}>
            Start quiz
          </button>
        </>
      ) : finished ? (
        <>
          <h3 ref={headingRef} tabIndex={-1} className="mt-2 font-heading text-lg font-bold text-contrast focus:outline-none">
            You scored {score} out of {total}
          </h3>
          <p className="mt-2 text-sm text-contrast/75">
            {score === total ? "Perfect score. You know this house inside out." : score >= total / 2 ? "Not bad at all." : "The house has secrets yet."}
          </p>
          <button type="button" onClick={restart} className={`mt-4 ${button}`}>
            Play again
          </button>
        </>
      ) : (
        <>
          <p className="mt-2 text-xs text-contrast/65">
            Question {index + 1} of {total}
          </p>
          <h3 ref={headingRef} tabIndex={-1} id={`${groupId}-q`} className="mt-1 font-heading text-lg font-bold leading-snug text-contrast focus:outline-none">
            {question.prompt}
          </h3>
          <div role="group" aria-labelledby={`${groupId}-q`} className="mt-4 space-y-2">
            {question.options.map((option) => {
              const isCorrect = option.id === correctId
              const picked = option.id === answer
              const state = !answer ? "idle" : isCorrect ? "correct" : picked ? "wrong" : "idle"
              return (
                <button
                  key={option.id}
                  type="button"
                  onClick={() => choose(option.id)}
                  aria-disabled={answer !== null}
                  className={`flex w-full items-center justify-between gap-3 rounded-xl border px-3 py-2.5 text-left text-sm text-contrast ${focusRing} ${
                    state === "correct"
                      ? "border-[#4ADE80] bg-[#4ADE80]/10"
                      : state === "wrong"
                        ? "border-[#FCA5A5] bg-[#FCA5A5]/10"
                        : answer
                          ? "border-contrast/10 opacity-60"
                          : "border-contrast/10 hover:border-contrast/25"
                  }`}
                >
                  {option.label}
                  {state === "correct" && <Check className="h-4 w-4 shrink-0 text-[#4ADE80]" aria-label="Correct answer" />}
                  {state === "wrong" && <X className="h-4 w-4 shrink-0 text-[#FCA5A5]" aria-label="Your answer, incorrect" />}
                </button>
              )
            })}
          </div>
          <div role="status" aria-live="polite" className="mt-3 text-sm text-contrast/80">
            {answer && (
              <>
                <p className="font-medium text-contrast">{answer === correctId ? "Correct!" : "Not quite."}</p>
                {question.explanation && <p className="mt-1">{question.explanation}</p>}
              </>
            )}
          </div>
          {answer && (
            <button type="button" onClick={next} className={`mt-4 ${button}`}>
              {index + 1 >= total ? "See your score" : "Next question"}
            </button>
          )}
        </>
      )}
    </article>
  )
}
