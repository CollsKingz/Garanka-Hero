const fs = require('fs');
let code = fs.readFileSync('src/App.tsx', 'utf-8');

const importAuth = "import { auth } from './lib/firebase';\nimport { onAuthStateChanged, signOut, getIdTokenResult } from 'firebase/auth';\n";
code = code.replace("import { db, setDoc, doc, onSnapshot } from './lib/firebase';", importAuth + "import { db, setDoc, doc, onSnapshot } from './lib/firebase';");

// Replace manual handleLogin
const handleLoginReg = /const handleLogin = \([\s\S]*?setAuditLogs\(\(prev\) => \[newAudit, \.\.\.prev\]\);\n  \};\n/;
code = code.replace(handleLoginReg, '');

const stateReg = /const \[authStatus, setAuthStatus\] = useState<'unauthenticated' \| 'authenticated'>\('unauthenticated'\);\n  const \[authRole, setAuthRole\] = useState<UserRole>\('community'\);\n  const \[authEmail, setAuthEmail\] = useState<string>\(''\);\n/;

const authEffect = `
  const [authStatus, setAuthStatus] = useState<'loading' | 'unauthenticated' | 'authenticated'>('loading');
  const [authRole, setAuthRole] = useState<UserRole>('community');
  const [authEmail, setAuthEmail] = useState<string>('');
  
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      if (user) {
        const tokenResult = await getIdTokenResult(user);
        const role = (tokenResult.claims.role as UserRole) || 'admin';
        setAuthEmail(user.email || '');
        setAuthRole(role);
        setCurrentRole(role);
        
        // Mock current user object
        const mockUser: UserProfile = {
          id: user.uid,
          name: user.displayName || user.email?.split('@')[0] || 'User',
          role: role,
          companyId: (tokenResult.claims.companyId as string) || 'comp-aegis',
          branchId: 'branch-hq',
          status: 'on-duty',
        };
        
        // Don't overwrite currentUser if we already set it to something richer, 
        // but for now let's ensure we have a valid currentUser
        setCurrentUser(mockUser);
        
        setAuthStatus('authenticated');
        setShowLocationModal(true);
      } else {
        setAuthStatus('unauthenticated');
        setCurrentUser(null);
      }
    });
    return () => unsubscribe();
  }, []);
`;

code = code.replace(stateReg, authEffect);

code = code.replace(/<LoginScreen\s*onLogin=\{handleLogin\}\s*\/>/, '<LoginScreen />');
code = code.replace(/if \(authStatus === 'unauthenticated'\)/, "if (authStatus === 'loading') { return <div className='min-h-screen bg-slate-50 flex items-center justify-center'>Loading...</div>; }\n  if (authStatus === 'unauthenticated')");

fs.writeFileSync('src/App.tsx', code);
