"use client"

import { useCallback, useEffect, useState } from "react"
import type { SupabaseClient } from "@supabase/supabase-js"
import { Button, Card, Field, Select, TextArea, TextInput, useNotice, useShows } from "./fields"

interface QuizRow {
  id: string
  show_id: string
  title: string
  status: "draft" | "published"
  published_at: string | null
  is_sample: boolean
  quiz_questions: { id: string }[]
}

type Draft = { prompt: string; explanation: string; options: string[]; correct: number }
const blankQuestion = (): Draft => ({ prompt: "", explanation: "", options: ["", "", ""], correct: 0 })

export default function QuizzesPanel({ db, userId }: { db: SupabaseClient; userId: string }) {
  const { shows } = useShows(db)
  const { ok, fail, clear, node: noticeNode } = useNotice()
  const [quizzes, setQuizzes] = useState<QuizRow[]>([])
  const [showId, setShowId] = useState("")
  const [title, setTitle] = useState("")
  const [description, setDescription] = useState("")
  const [questions, setQuestions] = useState<Draft[]>([blankQuestion()])
  const [busy, setBusy] = useState(false)

  useEffect(() => {
    if (!showId && shows[0]) setShowId(shows[0].id)
  }, [shows, showId])

  const load = useCallback(async () => {
    const { data, error } = await db
      .from("quizzes")
      .select("id, show_id, title, status, published_at, is_sample, quiz_questions(id)")
      .order("created_at", { ascending: false })
      .limit(50)
    if (error) fail("Couldn't load quizzes.", error)
    setQuizzes((data ?? []) as QuizRow[])
  }, [db, fail])

  useEffect(() => {
    load()
  }, [load])

  const update = (i: number, patch: Partial<Draft>) => setQuestions(questions.map((q, j) => (j === i ? { ...q, ...patch } : q)))
  const setOption = (qi: number, oi: number, value: string) =>
    update(qi, { options: questions[qi].options.map((o, j) => (j === oi ? value : o)) })

  async function create(publish: boolean) {
    clear()
    if (!showId) return fail("Choose a show.")
    if (!title.trim()) return fail("Add a quiz title.")
    for (const [i, q] of questions.entries()) {
      const filled = q.options.filter((o) => o.trim())
      if (!q.prompt.trim()) return fail(`Question ${i + 1} needs a question.`)
      if (filled.length < 2) return fail(`Question ${i + 1} needs at least two answers.`)
      if (!q.options[q.correct]?.trim()) return fail(`Question ${i + 1}: the answer marked correct is empty.`)
    }
    setBusy(true)
    const { data: quiz, error } = await db
      .from("quizzes")
      .insert({
        show_id: showId,
        title: title.trim(),
        description: description.trim() || null,
        status: publish ? "published" : "draft",
        published_at: publish ? new Date().toISOString() : null,
        created_by: userId,
      })
      .select("id")
      .single()
    if (error || !quiz) {
      setBusy(false)
      return fail("Couldn't create the quiz.", error)
    }
    try {
      for (const [i, q] of questions.entries()) {
        const { data: question, error: qError } = await db
          .from("quiz_questions")
          .insert({ quiz_id: quiz.id, prompt: q.prompt.trim(), explanation: q.explanation.trim() || null, sort_order: i + 1 })
          .select("id")
          .single()
        if (qError || !question) throw qError
        const rows = q.options
          .map((label, j) => ({ label: label.trim(), is_correct: j === q.correct, sort_order: j + 1 }))
          .filter((o) => o.label)
          .map((o) => ({ ...o, question_id: question.id }))
        const { error: oError } = await db.from("quiz_options").insert(rows)
        if (oError) throw oError
      }
    } catch (e) {
      await db.from("quizzes").delete().eq("id", quiz.id) // don't leave a half-saved quiz
      setBusy(false)
      return fail("Couldn't save the quiz questions.", e as { message?: string })
    }
    setBusy(false)
    ok(publish ? "Quiz published. It appears on the show page within a minute." : "Quiz saved as a draft.")
    setTitle("")
    setDescription("")
    setQuestions([blankQuestion()])
    load()
  }

  async function setPublished(quiz: QuizRow, publish: boolean) {
    const { error } = await db
      .from("quizzes")
      .update({ status: publish ? "published" : "draft", published_at: publish ? (quiz.published_at ?? new Date().toISOString()) : null })
      .eq("id", quiz.id)
    if (error) return fail("Couldn't update the quiz.", error)
    ok(publish ? "Quiz published." : "Quiz moved to drafts.")
    load()
  }

  async function remove(quiz: QuizRow) {
    if (!window.confirm(`Delete "${quiz.title}"? This can't be undone.`)) return
    const { error } = await db.from("quizzes").delete().eq("id", quiz.id)
    if (error) return fail("Couldn't delete the quiz.", error)
    ok("Quiz deleted.")
    load()
  }

  const showName = (id: string) => shows.find((s) => s.id === id)?.short_name ?? shows.find((s) => s.id === id)?.name ?? ""

  return (
    <div className="space-y-6">
      <Card>
        <h2 className="font-heading text-xl font-bold text-contrast">New quiz</h2>
        <div className="mt-5 grid gap-4 sm:grid-cols-2">
          <Field label="Show">
            {(id) => (
              <Select id={id} value={showId} onChange={(e) => setShowId(e.target.value)}>
                {shows.map((s) => (
                  <option key={s.id} value={s.id}>
                    {s.name}
                  </option>
                ))}
              </Select>
            )}
          </Field>
          <Field label="Title" hint={`${title.length}/120`}>
            {(id) => <TextInput id={id} value={title} onChange={(e) => setTitle(e.target.value)} maxLength={120} />}
          </Field>
          <div className="sm:col-span-2">
            <Field label="Short description (optional)">
              {(id) => <TextInput id={id} value={description} onChange={(e) => setDescription(e.target.value)} maxLength={300} />}
            </Field>
          </div>
        </div>

        <div className="mt-6 space-y-5">
          {questions.map((q, qi) => (
            <fieldset key={qi} className="rounded-xl border border-contrast/10 p-4">
              <legend className="px-1 text-sm font-medium text-contrast">Question {qi + 1}</legend>
              <div className="space-y-3">
                <TextInput aria-label={`Question ${qi + 1}`} placeholder="Question" value={q.prompt} maxLength={300} onChange={(e) => update(qi, { prompt: e.target.value })} />
                <div className="space-y-2" role="radiogroup" aria-label={`Answers for question ${qi + 1}; choose the correct one`}>
                  {q.options.map((option, oi) => (
                    <div key={oi} className="flex items-center gap-3">
                      <input
                        type="radio"
                        name={`correct-${qi}`}
                        checked={q.correct === oi}
                        onChange={() => update(qi, { correct: oi })}
                        aria-label={`Answer ${oi + 1} is correct`}
                        className="h-4 w-4 accent-[#4ADE80]"
                      />
                      <TextInput aria-label={`Answer ${oi + 1}`} placeholder={`Answer ${oi + 1}`} value={option} maxLength={160} onChange={(e) => setOption(qi, oi, e.target.value)} />
                    </div>
                  ))}
                </div>
                <p className="text-xs text-contrast/60">Select the circle beside the correct answer.</p>
                <div className="flex flex-wrap gap-2">
                  <Button variant="secondary" disabled={q.options.length >= 6} onClick={() => update(qi, { options: [...q.options, ""] })}>
                    Add answer
                  </Button>
                  <Button
                    variant="secondary"
                    disabled={q.options.length <= 2}
                    onClick={() => update(qi, { options: q.options.slice(0, -1), correct: Math.min(q.correct, q.options.length - 2) })}
                  >
                    Remove last answer
                  </Button>
                </div>
                <TextArea
                  aria-label={`Explanation for question ${qi + 1} (optional)`}
                  placeholder="Explanation shown after answering (optional)"
                  value={q.explanation}
                  maxLength={500}
                  rows={2}
                  onChange={(e) => update(qi, { explanation: e.target.value })}
                />
                {questions.length > 1 && (
                  <Button variant="danger" onClick={() => setQuestions(questions.filter((_, j) => j !== qi))}>
                    Remove question {qi + 1}
                  </Button>
                )}
              </div>
            </fieldset>
          ))}
        </div>
        <Button variant="secondary" className="mt-4" disabled={questions.length >= 15} onClick={() => setQuestions([...questions, blankQuestion()])}>
          Add question
        </Button>

        <div className="mt-5 flex flex-wrap gap-3">
          <Button onClick={() => create(true)} disabled={busy}>
            Publish quiz
          </Button>
          <Button variant="secondary" onClick={() => create(false)} disabled={busy}>
            Save as draft
          </Button>
        </div>
        <div className="mt-3">{noticeNode}</div>
      </Card>

      <Card>
        <h2 className="font-heading text-xl font-bold text-contrast">Quizzes</h2>
        {quizzes.length === 0 ? (
          <p className="mt-3 text-sm text-contrast/70">No quizzes yet.</p>
        ) : (
          <ul className="mt-4 divide-y divide-contrast/10">
            {quizzes.map((quiz) => (
              <li key={quiz.id} className="flex flex-wrap items-center gap-x-4 gap-y-2 py-3">
                <div className="min-w-0 flex-1">
                  <p className="font-medium text-contrast">{quiz.title}</p>
                  <p className="text-xs text-contrast/60">
                    {quiz.status === "published" ? "Published" : "Draft"} · {showName(quiz.show_id)} · {quiz.quiz_questions.length} questions
                    {quiz.is_sample && " · Sample"}
                  </p>
                </div>
                <div className="flex flex-wrap gap-2">
                  <Button variant="secondary" onClick={() => setPublished(quiz, quiz.status !== "published")} aria-label={`${quiz.status === "published" ? "Unpublish" : "Publish"} ${quiz.title}`}>
                    {quiz.status === "published" ? "Unpublish" : "Publish"}
                  </Button>
                  <Button variant="danger" onClick={() => remove(quiz)} aria-label={`Delete ${quiz.title}`}>
                    Delete
                  </Button>
                </div>
              </li>
            ))}
          </ul>
        )}
      </Card>
    </div>
  )
}
