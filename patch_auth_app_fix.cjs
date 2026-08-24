const fs = require('fs');
let code = fs.readFileSync('src/App.tsx', 'utf-8');

const oldState = "const [authStatus, setAuthStatus] = useState<'unauthenticated' | 'pending_otp' | 'authenticated'>('unauthenticated');";

const authEffect = `
  const [authStatus, setAuthStatus] = useState<'loading' | 'unauthenticated' | 'authenticated'>('loading');
  
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      if (user) {
        try {
          const tokenResult = await getIdTokenResult(user);
          const role = (tokenResult.claims.role as UserRole) || 'community';
          setAuthEmail(user.email || '');
          setAuthRole(role);
          setCurrentRole(role);
          
          const mockUser: UserProfile = {
            id: user.uid,
            name: user.displayName || user.email?.split('@')[0] || 'User',
            role: role,
            companyId: (tokenResult.claims.companyId as string) || 'comp-aegis',
            branchId: 'branch-hq',
            status: 'on-duty',
          };
          
          setCurrentUser(mockUser);
          setAuthStatus('authenticated');
          setShowLocationModal(true);
        } catch (e) {
          console.error(e);
          setAuthStatus('unauthenticated');
        }
      } else {
        setAuthStatus('unauthenticated');
        setCurrentUser(null);
      }
    });
    return () => unsubscribe();
  }, []);
`;

code = code.replace(oldState, authEffect);

fs.writeFileSync('src/App.tsx', code);
