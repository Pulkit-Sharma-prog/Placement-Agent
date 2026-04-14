import { useRef } from 'react'
import { motion, useScroll, useTransform, useInView } from 'framer-motion'
import { useNavigate } from 'react-router-dom'
import {
  Brain, FileSearch, Target, BarChart3, Users, Briefcase,
  ArrowRight, Sparkles, Zap, Shield, ChevronDown, GraduationCap,
  Building2, TrendingUp, CheckCircle,
} from 'lucide-react'

// ─── Animated background orbs ────────────────────────────────────────────────
function AuroraBackground() {
  return (
    <div className="absolute inset-0 overflow-hidden pointer-events-none">
      <motion.div
        className="absolute rounded-full blur-3xl"
        style={{
          width: 600, height: 600, top: '-10%', left: '15%',
          background: 'radial-gradient(circle, rgba(108,99,255,0.25), transparent 70%)',
        }}
        animate={{ x: [0, 60, -30, 0], y: [0, -40, 20, 0] }}
        transition={{ duration: 18, repeat: Infinity, ease: 'easeInOut' }}
      />
      <motion.div
        className="absolute rounded-full blur-3xl"
        style={{
          width: 500, height: 500, top: '20%', right: '5%',
          background: 'radial-gradient(circle, rgba(62,207,207,0.2), transparent 70%)',
        }}
        animate={{ x: [0, -50, 30, 0], y: [0, 30, -50, 0] }}
        transition={{ duration: 22, repeat: Infinity, ease: 'easeInOut' }}
      />
      <motion.div
        className="absolute rounded-full blur-3xl"
        style={{
          width: 400, height: 400, bottom: '5%', left: '35%',
          background: 'radial-gradient(circle, rgba(255,107,157,0.15), transparent 70%)',
        }}
        animate={{ x: [0, 40, -20, 0], y: [0, -30, 40, 0] }}
        transition={{ duration: 20, repeat: Infinity, ease: 'easeInOut' }}
      />
      {/* Grid overlay */}
      <div style={{
        position: 'absolute', inset: 0,
        backgroundImage: 'linear-gradient(rgba(108,99,255,0.03) 1px, transparent 1px), linear-gradient(90deg, rgba(108,99,255,0.03) 1px, transparent 1px)',
        backgroundSize: '60px 60px',
      }} />
    </div>
  )
}

// ─── Animated counter ────────────────────────────────────────────────────────
function AnimatedStat({ value, suffix = '', label }) {
  const ref = useRef(null)
  const inView = useInView(ref, { once: true })
  return (
    <div ref={ref} className="text-center">
      <motion.p
        className="text-4xl md:text-5xl font-bold aurora-text"
        initial={{ opacity: 0, y: 20 }}
        animate={inView ? { opacity: 1, y: 0 } : {}}
        transition={{ duration: 0.6 }}
        style={{ fontFamily: 'var(--font-heading)' }}
      >
        {inView ? value : '0'}{suffix}
      </motion.p>
      <p className="text-sm mt-2" style={{ color: 'var(--text-muted)' }}>{label}</p>
    </div>
  )
}

// ─── Feature card ────────────────────────────────────────────────────────────
function FeatureCard({ icon: Icon, title, desc, color, delay = 0 }) {
  const ref = useRef(null)
  const inView = useInView(ref, { once: true, margin: '-50px' })
  return (
    <motion.div
      ref={ref}
      initial={{ opacity: 0, y: 40 }}
      animate={inView ? { opacity: 1, y: 0 } : {}}
      transition={{ duration: 0.5, delay }}
      className="group relative p-6 rounded-2xl transition-all duration-500"
      style={{
        background: 'rgba(255,255,255,0.03)',
        border: '1px solid rgba(255,255,255,0.06)',
      }}
    >
      <div
        className="absolute inset-0 rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-500"
        style={{ background: `radial-gradient(circle at 50% 0%, ${color}15, transparent 70%)` }}
      />
      <div className="relative">
        <div
          className="w-12 h-12 rounded-xl flex items-center justify-center mb-4"
          style={{ background: `${color}15`, border: `1px solid ${color}30` }}
        >
          <Icon size={22} style={{ color }} />
        </div>
        <h3 className="font-semibold text-lg mb-2" style={{ fontFamily: 'var(--font-heading)' }}>{title}</h3>
        <p className="text-sm leading-relaxed" style={{ color: 'var(--text-secondary)' }}>{desc}</p>
      </div>
    </motion.div>
  )
}

// ─── How it works step ───────────────────────────────────────────────────────
function StepCard({ number, title, desc, icon: Icon, delay = 0 }) {
  const ref = useRef(null)
  const inView = useInView(ref, { once: true, margin: '-50px' })
  return (
    <motion.div
      ref={ref}
      initial={{ opacity: 0, x: -30 }}
      animate={inView ? { opacity: 1, x: 0 } : {}}
      transition={{ duration: 0.5, delay }}
      className="flex gap-5"
    >
      <div className="flex flex-col items-center flex-shrink-0">
        <div
          className="w-12 h-12 rounded-full flex items-center justify-center text-lg font-bold text-white"
          style={{ background: 'var(--gradient-aurora)' }}
        >
          {number}
        </div>
        <div className="w-px flex-1 mt-2" style={{ background: 'rgba(108,99,255,0.2)' }} />
      </div>
      <div className="pb-10">
        <div className="flex items-center gap-2 mb-1">
          <Icon size={16} style={{ color: 'var(--purple)' }} />
          <h4 className="font-semibold" style={{ fontFamily: 'var(--font-heading)' }}>{title}</h4>
        </div>
        <p className="text-sm" style={{ color: 'var(--text-secondary)' }}>{desc}</p>
      </div>
    </motion.div>
  )
}

// ─── Role CTA card ───────────────────────────────────────────────────────────
function RoleCard({ icon: Icon, role, tagline, features, gradient, path, delay = 0 }) {
  const navigate = useNavigate()
  const ref = useRef(null)
  const inView = useInView(ref, { once: true, margin: '-50px' })
  return (
    <motion.div
      ref={ref}
      initial={{ opacity: 0, y: 30 }}
      animate={inView ? { opacity: 1, y: 0 } : {}}
      transition={{ duration: 0.5, delay }}
      className="group relative rounded-2xl p-6 cursor-pointer overflow-hidden"
      style={{
        background: 'rgba(255,255,255,0.03)',
        border: '1px solid rgba(255,255,255,0.08)',
      }}
      onClick={() => navigate(path)}
    >
      <div
        className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-700"
        style={{ background: `linear-gradient(135deg, ${gradient})` }}
      />
      <div className="relative">
        <Icon size={32} className="mb-4" style={{ color: 'var(--text-primary)' }} />
        <h3 className="text-xl font-bold mb-1" style={{ fontFamily: 'var(--font-heading)' }}>{role}</h3>
        <p className="text-sm mb-4" style={{ color: 'var(--text-secondary)' }}>{tagline}</p>
        <ul className="space-y-2 mb-5">
          {features.map((f, i) => (
            <li key={i} className="flex items-center gap-2 text-sm" style={{ color: 'var(--text-secondary)' }}>
              <CheckCircle size={14} style={{ color: 'var(--teal)' }} /> {f}
            </li>
          ))}
        </ul>
        <div
          className="flex items-center gap-2 text-sm font-semibold group-hover:gap-3 transition-all"
          style={{ color: 'var(--purple)' }}
        >
          Get Started <ArrowRight size={16} />
        </div>
      </div>
    </motion.div>
  )
}

// ─── Main Landing Page ───────────────────────────────────────────────────────
export default function LandingPage() {
  const navigate = useNavigate()
  const heroRef = useRef(null)
  const { scrollYProgress } = useScroll({ target: heroRef, offset: ['start start', 'end start'] })
  const heroOpacity = useTransform(scrollYProgress, [0, 0.8], [1, 0])
  const heroY = useTransform(scrollYProgress, [0, 0.8], [0, -80])

  return (
    <div className="min-h-screen" style={{ background: 'var(--bg-base)', color: 'var(--text-primary)' }}>
      <AuroraBackground />

      {/* ── Navbar ─────────────────────────────────────────────────── */}
      <motion.nav
        initial={{ y: -60, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ duration: 0.5 }}
        className="sticky top-0 z-50 px-6 py-4 flex items-center justify-between"
        style={{
          background: 'rgba(10,15,30,0.75)',
          backdropFilter: 'blur(20px)',
          borderBottom: '1px solid rgba(255,255,255,0.06)',
        }}
      >
        <div className="flex items-center gap-2.5">
          <img src="/favicon.svg" alt="" className="w-8 h-8 rounded-lg" />
          <span className="text-xl font-bold aurora-text" style={{ fontFamily: 'var(--font-heading)' }}>
            PlacementsAI
          </span>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={() => navigate('/login')}
            className="px-4 py-2 rounded-xl text-sm font-medium transition-all hover:bg-white/5"
            style={{ color: 'var(--text-secondary)' }}
          >
            Sign In
          </button>
          <button
            onClick={() => navigate('/register')}
            className="px-5 py-2 rounded-xl text-sm font-semibold text-white transition-all hover:scale-105"
            style={{ background: 'var(--gradient-aurora)' }}
          >
            Get Started
          </button>
        </div>
      </motion.nav>

      {/* ── Hero ──────────────────────────────────────────────────── */}
      <section ref={heroRef} className="relative min-h-[90vh] flex items-center justify-center px-6">
        <motion.div
          style={{ opacity: heroOpacity, y: heroY }}
          className="max-w-4xl mx-auto text-center relative z-10"
        >
          {/* Badge */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full text-xs font-medium mb-6"
            style={{
              background: 'rgba(108,99,255,0.1)',
              border: '1px solid rgba(108,99,255,0.3)',
              color: 'var(--purple)',
            }}
          >
            <Sparkles size={13} /> Powered by Multi-Agent AI
          </motion.div>

          <motion.h1
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3, duration: 0.6 }}
            className="text-5xl md:text-7xl font-bold leading-tight mb-6"
            style={{ fontFamily: 'var(--font-heading)' }}
          >
            The Future of{' '}
            <span className="aurora-text">Campus Placements</span>
            {' '}is Here
          </motion.h1>

          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.5 }}
            className="text-lg md:text-xl max-w-2xl mx-auto mb-10"
            style={{ color: 'var(--text-secondary)' }}
          >
            8 intelligent AI agents work together to parse resumes, match candidates,
            manage recruiters, and deliver actionable analytics — all on autopilot.
          </motion.p>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.7 }}
            className="flex items-center justify-center gap-4 flex-wrap"
          >
            <button
              onClick={() => navigate('/register')}
              className="px-8 py-3.5 rounded-xl text-base font-semibold text-white flex items-center gap-2 transition-all hover:scale-105 hover:shadow-lg hover:shadow-purple-500/20"
              style={{ background: 'var(--gradient-aurora)' }}
            >
              Start Free <ArrowRight size={18} />
            </button>
            <button
              onClick={() => navigate('/login')}
              className="px-8 py-3.5 rounded-xl text-base font-medium flex items-center gap-2 transition-all hover:bg-white/5"
              style={{ border: '1px solid var(--border-subtle)', color: 'var(--text-secondary)' }}
            >
              Sign In
            </button>
          </motion.div>

          {/* Scroll indicator */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 1.5 }}
            className="absolute bottom-[-80px] left-1/2 -translate-x-1/2"
          >
            <motion.div
              animate={{ y: [0, 8, 0] }}
              transition={{ duration: 1.5, repeat: Infinity }}
            >
              <ChevronDown size={24} style={{ color: 'var(--text-muted)' }} />
            </motion.div>
          </motion.div>
        </motion.div>
      </section>

      {/* ── Stats bar ─────────────────────────────────────────────── */}
      <section className="relative z-10 max-w-5xl mx-auto px-6 py-16">
        <div
          className="grid grid-cols-2 md:grid-cols-4 gap-8 py-10 px-8 rounded-2xl"
          style={{
            background: 'rgba(255,255,255,0.03)',
            border: '1px solid rgba(255,255,255,0.06)',
          }}
        >
          <AnimatedStat value="300" suffix="+" label="Skills Detected" />
          <AnimatedStat value="8" label="AI Agents" />
          <AnimatedStat value="15" label="Skill Categories" />
          <AnimatedStat value="95" suffix="%" label="Match Accuracy" />
        </div>
      </section>

      {/* ── Features ──────────────────────────────────────────────── */}
      <section className="relative z-10 max-w-6xl mx-auto px-6 py-20">
        <div className="text-center mb-14">
          <motion.h2
            className="text-3xl md:text-4xl font-bold mb-4"
            style={{ fontFamily: 'var(--font-heading)' }}
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
          >
            Intelligent Placement <span className="aurora-text">Automation</span>
          </motion.h2>
          <p className="text-base max-w-xl mx-auto" style={{ color: 'var(--text-secondary)' }}>
            From resume upload to offer letter — every step is powered by specialised AI agents.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          <FeatureCard
            icon={FileSearch} title="AI Resume Parser"
            desc="Extracts skills, experience, projects, certifications, patents, and more using NLP — supports PDF and DOCX."
            color="#6C63FF" delay={0}
          />
          <FeatureCard
            icon={Target} title="Smart Matching Engine"
            desc="TF-IDF + cosine similarity computes precise match scores between student profiles and job requirements."
            color="#3ECFCF" delay={0.1}
          />
          <FeatureCard
            icon={Brain} title="Student Profiling"
            desc="Normalises 300+ skills across 15 categories, builds skill radar charts, and identifies learning gaps."
            color="#FF6B9D" delay={0.2}
          />
          <FeatureCard
            icon={Briefcase} title="Job Processing"
            desc="Classifies seniority, role category, and extracts required vs. preferred skills from any job description."
            color="#FF8C42" delay={0.3}
          />
          <FeatureCard
            icon={Users} title="Recruiter Management"
            desc="Tracks recruiter engagement, auto-generates shortlists, and exports branded PDF candidate reports."
            color="#A78BFA" delay={0.4}
          />
          <FeatureCard
            icon={BarChart3} title="Analytics Dashboard"
            desc="Real-time placement funnels, branch breakdowns, skills demand trends, and hiring company insights."
            color="#4ADE80" delay={0.5}
          />
        </div>
      </section>

      {/* ── How it works ──────────────────────────────────────────── */}
      <section className="relative z-10 max-w-3xl mx-auto px-6 py-20">
        <div className="text-center mb-14">
          <motion.h2
            className="text-3xl md:text-4xl font-bold mb-4"
            style={{ fontFamily: 'var(--font-heading)' }}
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
          >
            How It <span className="aurora-text">Works</span>
          </motion.h2>
        </div>

        <div>
          <StepCard number={1} icon={FileSearch} title="Upload Your Resume"
            desc="Drop a PDF or DOCX. Our AI parser extracts every detail — skills, work experience, projects, certifications, achievements, and more."
            delay={0}
          />
          <StepCard number={2} icon={Brain} title="AI Builds Your Profile"
            desc="Skills are normalised to 300+ canonical names, grouped into 15 categories, and your skill radar is computed instantly."
            delay={0.1}
          />
          <StepCard number={3} icon={Zap} title="Smart Job Matching"
            desc="Every active job is scored against your profile using TF-IDF similarity. You see your best matches ranked by fit score."
            delay={0.2}
          />
          <StepCard number={4} icon={TrendingUp} title="Apply & Track"
            desc="Apply with one click. Track your application status through the pipeline — from applied to interview to offer."
            delay={0.3}
          />
        </div>
      </section>

      {/* ── Role sections ─────────────────────────────────────────── */}
      <section className="relative z-10 max-w-6xl mx-auto px-6 py-20">
        <div className="text-center mb-14">
          <motion.h2
            className="text-3xl md:text-4xl font-bold mb-4"
            style={{ fontFamily: 'var(--font-heading)' }}
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
          >
            Built for <span className="aurora-text">Everyone</span>
          </motion.h2>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
          <RoleCard
            icon={GraduationCap} role="Students"
            tagline="Land your dream placement"
            features={['AI resume parsing', 'Skill-based job matching', 'Application tracking', 'Personalised recommendations']}
            gradient="rgba(108,99,255,0.15), rgba(62,207,207,0.08)"
            path="/register" delay={0}
          />
          <RoleCard
            icon={Building2} role="Recruiters"
            tagline="Find the best candidates"
            features={['Post jobs instantly', 'AI-ranked shortlists', 'PDF candidate reports', 'Engagement analytics']}
            gradient="rgba(255,107,157,0.12), rgba(255,140,66,0.08)"
            path="/login" delay={0.15}
          />
          <RoleCard
            icon={Shield} role="Placement Cell"
            tagline="Manage the entire pipeline"
            features={['Real-time analytics', 'Student management', 'Recruiter oversight', 'Placement funnel tracking']}
            gradient="rgba(62,207,207,0.12), rgba(108,99,255,0.08)"
            path="/login" delay={0.3}
          />
        </div>
      </section>

      {/* ── CTA ───────────────────────────────────────────────────── */}
      <section className="relative z-10 max-w-4xl mx-auto px-6 py-24 text-center">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="rounded-2xl p-12 relative overflow-hidden"
          style={{
            background: 'rgba(255,255,255,0.03)',
            border: '1px solid rgba(108,99,255,0.2)',
          }}
        >
          <div className="absolute inset-0 pointer-events-none"
            style={{ background: 'radial-gradient(ellipse at 50% 0%, rgba(108,99,255,0.15), transparent 60%)' }}
          />
          <div className="relative">
            <h2 className="text-3xl md:text-4xl font-bold mb-4" style={{ fontFamily: 'var(--font-heading)' }}>
              Ready to Transform Your <span className="aurora-text">Placement Process</span>?
            </h2>
            <p className="text-base mb-8 max-w-xl mx-auto" style={{ color: 'var(--text-secondary)' }}>
              Join the AI-powered placement revolution. Upload your resume and get matched in seconds.
            </p>
            <button
              onClick={() => navigate('/register')}
              className="px-10 py-4 rounded-xl text-base font-semibold text-white transition-all hover:scale-105 hover:shadow-lg hover:shadow-purple-500/25"
              style={{ background: 'var(--gradient-aurora)' }}
            >
              Get Started Now
            </button>
          </div>
        </motion.div>
      </section>

      {/* ── Footer ────────────────────────────────────────────────── */}
      <footer className="relative z-10 px-6 py-8 text-center" style={{ borderTop: '1px solid rgba(255,255,255,0.06)' }}>
        <p className="text-sm" style={{ color: 'var(--text-muted)' }}>
          PlacementsAI — Multi-Agent AI Platform for Campus Placements
        </p>
      </footer>
    </div>
  )
}
