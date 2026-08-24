const fs = require('fs');
let code = fs.readFileSync('src/components/auth/LoginScreen.tsx', 'utf-8');

const importsToAdd = `import { createUserWithEmailAndPassword, getIdToken } from 'firebase/auth';\n`;
code = code.replace(`import { signInWithEmailAndPassword } from 'firebase/auth';`, `import { signInWithEmailAndPassword, createUserWithEmailAndPassword, getIdToken } from 'firebase/auth';`);

const newComponentCode = `
export const LoginScreen: React.FC = () => {
  const [isRegistering, setIsRegistering] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [role, setRole] = useState('community');
  const [companyId, setCompanyId] = useState('comp-aegis');
  const [isSigningIn, setIsSigningIn] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password) return;
    setIsSigningIn(true);
    setError('');
    try {
      if (isRegistering) {
        const userCred = await createUserWithEmailAndPassword(auth, email, password);
        const idToken = await getIdToken(userCred.user);
        
        // Set role via backend
        const res = await fetch('/api/admin/set-role', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': \`Bearer \${idToken}\`
          },
          body: JSON.stringify({ role, companyId })
        });
        
        if (!res.ok) {
          throw new Error('Failed to set user role.');
        }
        
        // Force token refresh so the new claims take effect immediately
        await userCred.user.getIdToken(true);
        // Page should reload or App.tsx should handle the new auth state
        window.location.reload();
      } else {
        await signInWithEmailAndPassword(auth, email, password);
      }
    } catch (err: any) {
      setError(err.message || 'Failed to authenticate');
      setIsSigningIn(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col justify-center items-center py-10 px-4 sm:px-6 lg:px-8 relative overflow-hidden">
      <div className="absolute -top-40 -right-40 w-96 h-96 bg-red-100 rounded-full blur-3xl opacity-70 pointer-events-none"></div>
      <div className="absolute -bottom-40 -left-40 w-96 h-96 bg-red-50 rounded-full blur-3xl opacity-80 pointer-events-none"></div>
      <div className="w-full max-w-md mx-auto space-y-8 relative z-10">
        <div className="text-center space-y-3">
          <div className="inline-flex items-center justify-center gap-2.5 bg-red-600 text-white px-5 py-2 rounded-2xl shadow-lg shadow-red-500/20">
            <Shield className="w-6 h-6 fill-white text-white" />
            <span className="font-black tracking-wider text-base uppercase">GARANKA ADMIN</span>
          </div>
          <h1 className="text-3xl font-extrabold text-slate-900 tracking-tight">
            {isRegistering ? 'Create Account' : 'Sign In'}
          </h1>
          <p className="text-sm text-slate-600">
            {isRegistering 
              ? 'Register a new account for the security operations workspace.' 
              : 'Enter your credentials to access the security operations workspace.'}
          </p>
        </div>
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white border border-slate-200 rounded-3xl p-6 sm:p-8 shadow-xl shadow-slate-200/60"
        >
          <form onSubmit={handleSubmit} className="space-y-5">
            {error && <div className="text-red-600 bg-red-50 p-2 rounded text-xs font-bold">{error}</div>}
            
            <div className="space-y-1.5">
              <label className="text-xs font-bold uppercase tracking-wider text-slate-500 ml-1">
                Email
              </label>
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="user@example.com"
                className="w-full bg-slate-50 border border-slate-200 text-slate-900 rounded-xl px-4 py-3 outline-none focus:border-red-500 focus:ring-1 focus:ring-red-500 transition-all font-mono text-sm"
              />
            </div>
            <div className="space-y-1.5">
              <label className="text-xs font-bold uppercase tracking-wider text-slate-500 ml-1">
                Password
              </label>
              <input
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full bg-slate-50 border border-slate-200 text-slate-900 rounded-xl px-4 py-3 outline-none focus:border-red-500 focus:ring-1 focus:ring-red-500 transition-all font-mono text-sm"
              />
            </div>

            {isRegistering && (
              <>
                <div className="space-y-1.5">
                  <label className="text-xs font-bold uppercase tracking-wider text-slate-500 ml-1">
                    Role
                  </label>
                  <select
                    value={role}
                    onChange={(e) => setRole(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 text-slate-900 rounded-xl px-4 py-3 outline-none focus:border-red-500 focus:ring-1 focus:ring-red-500 transition-all font-mono text-sm"
                  >
                    <option value="community">Community / Resident</option>
                    <option value="guard">Security Guard</option>
                    <option value="supervisor">Supervisor</option>
                    <option value="manager">Manager</option>
                    <option value="admin">Company Admin</option>
                  </select>
                </div>
                <div className="space-y-1.5">
                  <label className="text-xs font-bold uppercase tracking-wider text-slate-500 ml-1">
                    Company ID
                  </label>
                  <input
                    type="text"
                    required
                    value={companyId}
                    onChange={(e) => setCompanyId(e.target.value)}
                    placeholder="comp-aegis"
                    className="w-full bg-slate-50 border border-slate-200 text-slate-900 rounded-xl px-4 py-3 outline-none focus:border-red-500 focus:ring-1 focus:ring-red-500 transition-all font-mono text-sm"
                  />
                </div>
              </>
            )}

            <button
              type="submit"
              disabled={isSigningIn}
              className="w-full flex items-center justify-center gap-2 bg-red-600 hover:bg-red-700 text-white font-bold py-3.5 rounded-xl shadow-md transition-all cursor-pointer disabled:opacity-70 disabled:cursor-not-allowed mt-2"
            >
              <Lock className="w-4 h-4" />
              {isSigningIn ? 'Processing...' : (isRegistering ? 'Register' : 'Sign In')}
            </button>
          </form>

          <div className="mt-6 text-center">
            <button
              onClick={() => setIsRegistering(!isRegistering)}
              className="text-sm font-bold text-red-600 hover:text-red-700 transition-colors cursor-pointer"
            >
              {isRegistering ? 'Already have an account? Sign In' : 'Need an account? Register'}
            </button>
          </div>
        </motion.div>
      </div>
    </div>
  );
};
`;

code = code.replace(/export const LoginScreen: React\.FC = \(\) => \{[\s\S]*?^};\n/m, newComponentCode);

fs.writeFileSync('src/components/auth/LoginScreen.tsx', code);
