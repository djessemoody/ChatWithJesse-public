interface ProfileLink {
  label: string;
  url: string;
  icon: "github" | "linkedin" | "patent" | "resume";
  hoverColor: string;
}

const links: ProfileLink[] = [
  {
    label: "GitHub",
    url: "https://github.com/djessemoody/ChatWithJesse-public",
    icon: "github",
    hoverColor: "hover:text-white hover:bg-gray-700/60",
  },
  {
    label: "LinkedIn",
    url: "https://linkedin.com/in/djessemoody",
    icon: "linkedin",
    hoverColor: "hover:text-sky-300 hover:bg-sky-900/30",
  },
  {
    label: "Prior ML Inventions",
    url: "https://tinyurl.com/moodypatent",
    icon: "patent",
    hoverColor: "hover:text-amber-300 hover:bg-amber-900/20",
  },
  {
    label: "Resume",
    url: "/jesse-moody-resume.pdf",
    icon: "resume",
    hoverColor: "hover:text-emerald-300 hover:bg-emerald-900/20",
  },
];

function GitHubIcon() {
  return (
    <svg
      className="w-5 h-5"
      fill="currentColor"
      viewBox="0 0 24 24"
      aria-hidden="true"
    >
      <path
        fillRule="evenodd"
        d="M12 2C6.477 2 2 6.484 2 12.017c0 4.425 2.865 8.18 6.839 9.504.5.092.682-.217.682-.483 0-.237-.008-.868-.013-1.703-2.782.605-3.369-1.343-3.369-1.343-.454-1.158-1.11-1.466-1.11-1.466-.908-.62.069-.608.069-.608 1.003.07 1.531 1.032 1.531 1.032.892 1.53 2.341 1.088 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.113-4.555-4.951 0-1.093.39-1.988 1.029-2.688-.103-.253-.446-1.272.098-2.65 0 0 .84-.27 2.75 1.026A9.564 9.564 0 0112 6.844c.85.004 1.705.115 2.504.337 1.909-1.296 2.747-1.027 2.747-1.027.546 1.379.202 2.398.1 2.651.64.7 1.028 1.595 1.028 2.688 0 3.848-2.339 4.695-4.566 4.943.359.309.678.92.678 1.855 0 1.338-.012 2.419-.012 2.747 0 .268.18.58.688.482A10.019 10.019 0 0022 12.017C22 6.484 17.522 2 12 2z"
        clipRule="evenodd"
      />
    </svg>
  );
}

function LinkedInIcon() {
  return (
    <svg
      className="w-5 h-5"
      fill="currentColor"
      viewBox="0 0 24 24"
      aria-hidden="true"
    >
      <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433a2.062 2.062 0 01-2.063-2.065 2.064 2.064 0 112.063 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z" />
    </svg>
  );
}

function PatentIcon() {
  return (
    <svg
      className="w-5 h-5"
      fill="none"
      stroke="currentColor"
      strokeWidth={2}
      viewBox="0 0 24 24"
      aria-hidden="true"
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M19.5 14.25v-2.625a3.375 3.375 0 00-3.375-3.375h-1.5A1.125 1.125 0 0113.5 7.125v-1.5a3.375 3.375 0 00-3.375-3.375H8.25m2.25 0H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 00-9-9z"
      />
    </svg>
  );
}

function ResumeIcon() {
  return (
    <svg
      className="w-5 h-5"
      fill="none"
      stroke="currentColor"
      strokeWidth={2}
      viewBox="0 0 24 24"
      aria-hidden="true"
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M12 7.5h1.5m-1.5 3h1.5m-7.5 3h7.5m-7.5 3h7.5m3-9h3.375c.621 0 1.125.504 1.125 1.125V18a2.25 2.25 0 01-2.25 2.25M16.5 7.5V18a2.25 2.25 0 002.25 2.25M16.5 7.5V4.875c0-.621-.504-1.125-1.125-1.125H4.125C3.504 3.75 3 4.254 3 4.875V18a2.25 2.25 0 002.25 2.25h13.5M6 7.5h3v3H6v-3z"
      />
    </svg>
  );
}

const iconMap = {
  github: GitHubIcon,
  linkedin: LinkedInIcon,
  patent: PatentIcon,
  resume: ResumeIcon,
};

function ProfileLinks({ className }: { className?: string }) {
  return (
    <nav className={className} aria-label="Profile links">
      {links.map((link) => {
        const Icon = iconMap[link.icon];
        return (
          <a
            key={link.label}
            href={link.url}
            target="_blank"
            rel="noopener noreferrer"
            className={`flex items-center gap-2 md:gap-3 px-3 md:px-4 py-2 md:py-2.5 rounded-lg text-gray-400 ${link.hoverColor} transition-all duration-200 link-glow`}
          >
            <Icon />
            <span className="text-xs md:text-sm font-medium">{link.label}</span>
          </a>
        );
      })}
    </nav>
  );
}

export function ProfileSidebar() {
  return (
    <>
      {/* Mobile: two-row top banner */}
      <aside className="flex md:hidden landscape-show flex-col border-b border-white/10 sidebar-gradient" data-testid="profile-mobile">
        <div className="flex items-center gap-3 px-4 pt-3 pb-1">
          <img
            src="/jesse-profile.png"
            alt="Jesse Moody"
            className="w-10 h-10 rounded-full object-cover border border-indigo-400/40 shadow"
          />
          <div className="min-w-0">
            <h2 className="text-sm font-bold text-white leading-tight">Jesse Moody</h2>
            <p className="text-xs text-gray-400">
              Engineering leader &bull; Software Architect &bull; AI/ML Builder
            </p>
          </div>
        </div>
        <ProfileLinks className="flex items-center justify-center gap-1 px-4 pb-2" />
      </aside>

      {/* Desktop: full sidebar */}
      <aside className="hidden md:flex landscape-hidden flex-col items-center w-72 shrink-0 border-r border-white/10 sidebar-gradient py-8 px-4 gap-6" data-testid="profile-desktop">
        <div className="profile-glow-ring">
          <img
            src="/jesse-profile.png"
            alt="Jesse Moody"
            className="relative z-10 w-36 h-36 rounded-full object-cover shadow-lg"
          />
        </div>
        <div className="text-center">
          <h2 className="text-xl font-bold text-white">Jesse Moody</h2>
          <p className="text-sm text-indigo-300/70 mt-1 leading-relaxed">
            Engineering Leader<br />
            Software Architect<br />
            AI/ML Builder
          </p>
        </div>
        <div className="w-16 h-px bg-gradient-to-r from-transparent via-indigo-500/40 to-transparent" />
        <ProfileLinks className="flex flex-col gap-2 w-full" />
      </aside>
    </>
  );
}
