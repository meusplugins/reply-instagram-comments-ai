import React, { useState, useEffect } from 'react';
import { analyzeComment } from './services/aiService';
import { 
  Instagram, Home, Search, PlusSquare, Heart, LogOut, 
  MessageCircle, Send, Bookmark, Smile, 
  Loader2, Trash2, Shield
} from 'lucide-react';
import { motion } from 'motion/react';
import { formatDistanceToNow } from 'date-fns';
import { ptBR } from 'date-fns/locale';

// --- Types ---

interface UserProfile {
  uid: string;
  displayName: string;
  photoURL: string | null;
  email: string;
  role: 'admin' | 'user';
}

interface Post {
  id: string;
  authorUID: string;
  authorName: string;
  authorPhoto: string | null;
  imageURL: string;
  caption: string;
  createdAt: Date;
  likesCount: number;
}

interface Comment {
  id: string;
  postID: string;
  authorUID: string;
  authorName: string;
  authorPhoto: string | null;
  text: string;
  createdAt: Date;
  sentiment?: 'positive' | 'neutral' | 'negative';
  automatedReply?: string;
}

// --- Components ---

const Navbar = ({ user, onLogout, onOpenCreatePost }: { user: UserProfile | null, onLogout: () => void, onOpenCreatePost: () => void }) => (
  <nav className="fixed top-0 left-0 right-0 h-16 bg-white border-b border-gray-200 z-50 flex items-center justify-center px-4">
    <div className="max-w-5xl w-full flex items-center justify-between">
      <div className="flex items-center gap-2 cursor-pointer" onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}>
        <Instagram className="w-6 h-6" />
        <span className="text-xl font-bold font-serif tracking-tight">Vibe Terapias</span>
      </div>
      
      <div className="hidden md:flex items-center bg-gray-100 rounded-lg px-3 py-1.5 w-64">
        <Search className="w-4 h-4 text-gray-400 mr-2" />
        <input type="text" placeholder="Pesquisar" className="bg-transparent text-sm outline-none w-full" />
      </div>

      <div className="flex items-center gap-5">
        <Home className="w-6 h-6 cursor-pointer hover:scale-110 transition-transform" />
        <PlusSquare className="w-6 h-6 cursor-pointer hover:scale-110 transition-transform" onClick={onOpenCreatePost} />
        <Heart className="w-6 h-6 cursor-pointer hover:scale-110 transition-transform" />
        {user && (
          <div className="flex items-center gap-3">
            <div className="relative group">
              <img 
                src={user.photoURL || `https://ui-avatars.com/api/?name=${user.displayName}`} 
                alt={user.displayName}
                className="w-7 h-7 rounded-full border border-gray-200 cursor-pointer"
              />
              {user.role === 'admin' && (
                <Shield className="w-3 h-3 text-blue-500 absolute -bottom-1 -right-1 bg-white rounded-full" />
              )}
            </div>
            <button onClick={onLogout} className="text-gray-500 hover:text-red-500 transition-colors">
              <LogOut className="w-5 h-5" />
            </button>
          </div>
        )}
      </div>
    </div>
  </nav>
);

interface PostCardProps {
  key?: React.Key;
  post: Post;
  currentUser: UserProfile | null;
  onDelete: (id: string) => void;
}

const PostCard = ({ post, currentUser, onDelete }: PostCardProps) => {
  const [comments, setComments] = useState<Comment[]>([]);
  const [newComment, setNewComment] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isLiked, setIsLiked] = useState(false);

  const handleAddComment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newComment.trim() || !currentUser || isSubmitting) return;

    setIsSubmitting(true);
    try {
      const commentId = Math.random().toString(36).substr(2, 9);
      const commentData: Comment = {
        id: commentId,
        postID: post.id,
        authorUID: currentUser.uid,
        authorName: currentUser.displayName,
        authorPhoto: currentUser.photoURL,
        text: newComment,
        createdAt: new Date()
      };

      // AI Analysis
      const analysis = await analyzeComment(newComment, post.caption, currentUser.displayName);
      
      const analyzedComment: Comment = {
        ...commentData,
        sentiment: analysis.sentiment,
        automatedReply: analysis.automatedReply
      };

      setComments(prev => [...prev, analyzedComment]);
      setNewComment('');
    } catch (error) {
      console.error("Error adding comment:", error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeleteComment = (commentId: string) => {
    setComments(prev => prev.filter(c => c.id !== commentId));
  };

  return (
    <motion.div 
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-white border border-gray-200 rounded-lg mb-6 overflow-hidden shadow-sm"
    >
      {/* Header */}
      <div className="flex items-center justify-between p-3">
        <div className="flex items-center gap-3">
          <img 
            src={post.authorPhoto || `https://ui-avatars.com/api/?name=${post.authorName}`} 
            alt={post.authorName}
            className="w-8 h-8 rounded-full border border-gray-100"
          />
          <span className="font-semibold text-sm">{post.authorName}</span>
        </div>
        {(currentUser?.uid === post.authorUID || currentUser?.role === 'admin') && (
          <button onClick={() => onDelete(post.id)} className="text-gray-400 hover:text-red-500 transition-colors">
            <Trash2 className="w-4 h-4" />
          </button>
        )}
      </div>

      {/* Image */}
      <div className="aspect-square bg-gray-50 flex items-center justify-center overflow-hidden">
        <img 
          src={post.imageURL} 
          alt="Post content" 
          className="w-full h-full object-cover"
          referrerPolicy="no-referrer"
        />
      </div>

      {/* Actions */}
      <div className="p-3">
        <div className="flex items-center gap-4 mb-2">
          <Heart 
            className={`w-6 h-6 cursor-pointer transition-colors ${isLiked ? 'fill-red-500 text-red-500' : 'hover:text-gray-500'}`} 
            onClick={() => setIsLiked(!isLiked)}
          />
          <MessageCircle className="w-6 h-6 cursor-pointer hover:text-gray-500" />
          <Send className="w-6 h-6 cursor-pointer hover:text-gray-500" />
          <div className="flex-grow" />
          <Bookmark className="w-6 h-6 cursor-pointer hover:text-gray-500" />
        </div>

        <div className="font-semibold text-sm mb-1">
          {post.likesCount + (isLiked ? 1 : 0)} curtidas
        </div>

        <div className="text-sm mb-2">
          <span className="font-semibold mr-2">{post.authorName}</span>
          {post.caption}
        </div>

        {/* Comments */}
        <div className="space-y-2 mb-3">
          {comments.map(comment => (
            <div key={comment.id} className="text-sm group">
              <div className="flex items-start justify-between">
                <div>
                  <span className="font-semibold mr-2">{comment.authorName}</span>
                  {comment.text}
                  {comment.sentiment && (
                    <span className={`ml-2 text-[10px] uppercase font-bold px-1 rounded ${
                      comment.sentiment === 'positive' ? 'bg-green-100 text-green-600' :
                      comment.sentiment === 'negative' ? 'bg-red-100 text-red-600' :
                      'bg-gray-100 text-gray-600'
                    }`}>
                      {comment.sentiment}
                    </span>
                  )}
                </div>
                <button 
                  onClick={() => handleDeleteComment(comment.id)}
                  className="opacity-0 group-hover:opacity-100 text-gray-400 hover:text-red-500 transition-all"
                >
                  <Trash2 className="w-3 h-3" />
                </button>
              </div>
              
              {/* Automated Reply */}
              {comment.automatedReply && (
                <div className="ml-6 mt-1 flex items-start gap-2 text-gray-500 italic text-[13px] bg-gray-50 p-2 rounded-md border-l-2 border-blue-400">
                  <div className="flex-shrink-0 mt-0.5">
                    <Instagram className="w-3 h-3 text-blue-500" />
                  </div>
                  <div>
                    <span className="font-semibold not-italic text-blue-600 mr-1">Vibe Terapias:</span>
                    {comment.automatedReply}
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>

        <div className="text-[10px] text-gray-400 uppercase mb-3">
          {formatDistanceToNow(post.createdAt, { addSuffix: true, locale: ptBR })}
        </div>

        {/* Add Comment */}
        <form onSubmit={handleAddComment} className="flex items-center border-t border-gray-100 pt-3">
          <Smile className="w-6 h-6 text-gray-400 mr-3" />
          <input 
            type="text" 
            placeholder="Adicione um comentário..." 
            className="flex-grow text-sm outline-none"
            value={newComment}
            onChange={(e) => setNewComment(e.target.value)}
            disabled={isSubmitting}
          />
          <button 
            type="submit" 
            disabled={!newComment.trim() || isSubmitting}
            className={`text-blue-500 font-semibold text-sm ml-2 ${(!newComment.trim() || isSubmitting) ? 'opacity-50' : 'hover:text-blue-700'}`}
          >
            {isSubmitting ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Publicar'}
          </button>
        </form>
      </div>
    </motion.div>
  );
};

interface CreatePostModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentUser: UserProfile | null;
}

const CreatePostModal = ({ isOpen, onClose, currentUser, onAddPost }: { isOpen: boolean, onClose: () => void, currentUser: UserProfile | null, onAddPost: (post: Post) => void }) => {
  const [imageURL, setImageURL] = useState('');
  const [caption, setCaption] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!imageURL || !currentUser || isSubmitting) return;

    setIsSubmitting(true);
    const newPost: Post = {
      id: Math.random().toString(36).substr(2, 9),
      authorUID: currentUser.uid,
      authorName: currentUser.displayName,
      authorPhoto: currentUser.photoURL,
      imageURL,
      caption,
      createdAt: new Date(),
      likesCount: 0
    };
    onAddPost(newPost);
    onClose();
    setImageURL('');
    setCaption('');
    setIsSubmitting(false);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/60 z-[100] flex items-center justify-center p-4 backdrop-blur-sm">
      <motion.div 
        initial={{ scale: 0.9, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        className="bg-white rounded-xl max-w-lg w-full overflow-hidden shadow-2xl"
      >
        <div className="flex items-center justify-between p-4 border-b border-gray-100">
          <button onClick={onClose} className="text-sm font-semibold text-gray-500">Cancelar</button>
          <span className="font-semibold">Nova Publicação</span>
          <button 
            onClick={handleSubmit} 
            disabled={!imageURL || isSubmitting}
            className="text-sm font-semibold text-blue-500 disabled:opacity-50"
          >
            {isSubmitting ? 'Publicando...' : 'Compartilhar'}
          </button>
        </div>
        
        <div className="p-6 space-y-4">
          <div className="space-y-2">
            <label className="text-xs font-bold text-gray-500 uppercase">URL da Imagem</label>
            <input 
              type="text" 
              placeholder="https://exemplo.com/imagem.jpg"
              className="w-full p-3 bg-gray-50 border border-gray-200 rounded-lg outline-none focus:border-blue-500 transition-colors"
              value={imageURL}
              onChange={(e) => setImageURL(e.target.value)}
            />
          </div>
          
          <div className="space-y-2">
            <label className="text-xs font-bold text-gray-500 uppercase">Legenda</label>
            <textarea 
              placeholder="Escreva uma legenda..."
              className="w-full p-3 bg-gray-50 border border-gray-200 rounded-lg outline-none focus:border-blue-500 transition-colors h-32 resize-none"
              value={caption}
              onChange={(e) => setCaption(e.target.value)}
            />
          </div>

          {imageURL && (
            <div className="aspect-video rounded-lg overflow-hidden border border-gray-200">
              <img src={imageURL} alt="Preview" className="w-full h-full object-cover" referrerPolicy="no-referrer" />
            </div>
          )}
        </div>
      </motion.div>
    </div>
  );
};

const LoginScreen = ({ onLogin }: { onLogin: () => void }) => (
  <div className="min-h-screen bg-gray-50 flex flex-col items-center justify-center p-4">
    <div className="max-w-sm w-full bg-white border border-gray-200 p-10 flex flex-col items-center shadow-sm rounded-lg">
      <div className="flex items-center gap-3 mb-8">
        <Instagram className="w-10 h-10" />
        <h1 className="text-3xl font-serif font-bold tracking-tight">Vibe Terapias</h1>
      </div>
      
      <p className="text-center text-gray-500 mb-8 text-sm">
        Bem-vindo ao portal da Vibe Terapias. Entre para gerenciar suas publicações e interações com IA.
      </p>

      <button 
        onClick={onLogin}
        className="w-full bg-blue-500 hover:bg-blue-600 text-white font-semibold py-2 rounded-lg flex items-center justify-center gap-3 transition-colors shadow-md"
      >
        <img src="https://www.google.com/favicon.ico" className="w-4 h-4 bg-white rounded-full" alt="Google" />
        Entrar com Google
      </button>
    </div>

    <div className="mt-6 flex gap-4 text-xs text-gray-400">
      <span>Sobre</span>
      <span>Ajuda</span>
      <span>API</span>
      <span>Privacidade</span>
      <span>Termos</span>
    </div>
  </div>
);

// --- Mock Data ---

const INITIAL_POSTS: Post[] = [
  {
    id: 'post-1',
    authorUID: 'admin',
    authorName: 'Vibe Terapias',
    authorPhoto: 'https://picsum.photos/seed/vibe1/200/200',
    imageURL: 'https://instagram.fldb1-1.fna.fbcdn.net/v/t51.82787-15/658821808_17959144518102650_8751765835693170279_n.jpg?stp=dst-jpg_e35_tt6&_nc_cat=103&ig_cache_key=Mzg2ODU3Nzg3MjY4MDQyNTU0MA%3D%3D.3-ccb7-5&ccb=7-5&_nc_sid=58cdad&efg=eyJ2ZW5jb2RlX3RhZyI6InhwaWRzLjE0NDB4MTkyMC5zZHIuQzMifQ%3D%3D&_nc_ohc=0wCDxGx19k8Q7kNvwES1AFb&_nc_oc=AdqgHtq1FWfLu-mX3jl_JILxCyFZFigFUH0Zo-ASIj-9sK4r0VXZKRqe40VMotVz23yKOQuophGap4XJL56Kdrwu&_nc_ad=z-m&_nc_cid=0&_nc_zt=23&_nc_ht=instagram.fldb1-1.fna&_nc_gid=-ifJ0auyMCoS_bA1bC6pvw&_nc_ss=7a32e&oh=00_Af36NbLF6t5bXa9asREiLkGcxdj7BfaI_IMCIv06i5m-5A&oe=69D8484B',
    caption: 'Páscoa: um convite para recomeçar de dentro para fora. A Páscoa vai além de datas, ela simboliza renovação, cuidado e novos começos. É o momento ideal para desacelerar, olhar para si com mais atenção e acolher aquilo que precisa ser cuidado. Na Vibe Terapias, acreditamos que recomeçar também é um ato de autocuidado. Que essa nova fase venha com mais leveza, consciência e bem-estar.',
    createdAt: new Date(),
    likesCount: 124
  },
  {
    id: 'post-2',
    authorUID: 'admin',
    authorName: 'Vibe Terapias',
    authorPhoto: 'https://picsum.photos/seed/vibe1/200/200',
    imageURL: 'https://instagram.fldb1-1.fna.fbcdn.net/v/t51.82787-15/658800387_17958564954102650_7479196950455991949_n.jpg?stp=dst-jpg_e35_tt6&_nc_cat=108&ig_cache_key=Mzg2NzQ2MDIzMTg4Njg5NzIwNw%3D%3D.3-ccb7-5&ccb=7-5&_nc_sid=58cdad&efg=eyJ2ZW5jb2RlX3RhZyI6InhwaWRzLjEzNjV4MTgyMC5zZHIuQzMifQ%3D%3D&_nc_ohc=XWv6lmG89yQQ7kNvwELgiw_&_nc_oc=Adp4u8NzT7QQbszRT6z9rDPz7Qc-XQLJ3n0ifVPEcqoEwH9005JjreVfcFoGaMOWy1kSk_7BgtIn5Gv1JX4rYTo1&_nc_ad=z-m&_nc_cid=0&_nc_zt=23&_nc_ht=instagram.fldb1-1.fna&_nc_gid=_XKGvNiVeWKymEbcO9ldoQ&_nc_ss=7a32e&oh=00_Af0htD5wfI3ZAap9aOOV0tjtOFSxE5gTMifgwFW0HG-3KQ&oe=69D840EF',
    caption: 'Quando foi a última vez que você realmente ouviu o seu corpo? Nem sempre ele fala alto, mas sempre dá sinais. Você tem prestado atenção neles? No corre-corre do dia a dia, muitas vezes ignoramos os pequenos sinais que o corpo nos envia, até que a dor se torne impossível de ignorar. Na Vibe Terapias, acreditamos que o cuidado começa ao ouvir o seu corpo, entendendo suas necessidades e buscando soluções para restabelecer o equilíbrio. Permita-se refletir sobre os sinais que seu corpo está enviando e agende uma sessão para cuidar de você de forma personalizada. Conte com a gente! Vem pra Vibe.',
    createdAt: new Date(),
    likesCount: 89
  },
  {
    id: 'post-3',
    authorUID: 'admin',
    authorName: 'Vibe Terapias',
    authorPhoto: 'https://picsum.photos/seed/vibe1/200/200',
    imageURL: 'https://instagram.fldb1-1.fna.fbcdn.net/v/t51.82787-15/657892461_17958562920102650_6244935393239674271_n.jpg?stp=dst-jpg_e35_tt6&_nc_cat=106&ig_cache_key=Mzg2NzEyODM4MDk5NTQ4OTE5NA%3D%3D.3-ccb7-5&ccb=7-5&_nc_sid=58cdad&efg=eyJ2ZW5jb2RlX3RhZyI6InhwaWRzLjEzNjV4MTgyMC5zZHIuQzMifQ%3D%3D&_nc_ohc=1_iqtSlfvQoQ7kNvwGSP-Q4&_nc_oc=AdpiyCZMofsBwu7-ydho1Vj9QM5hxKtPlJyMnX0aE5pFD-oQuZEBCjaAnlLsVyIdUZYNenJ-L4haWxIvkwViFfaB&_nc_ad=z-m&_nc_cid=0&_nc_zt=23&_nc_ht=instagram.fldb1-1.fna&_nc_gid=-ifJ0auyMCoS_bA1bC6pvw&_nc_ss=7a32e&oh=00_Af1qqdcj7JI2ZrXbu2qloHPQ4QcWQETeS0nIxYMyQ7Jisw&oe=69D83955',
    caption: 'Talvez o que você precisa não seja continuar… é pausar. No meio da rotina agitada, é fácil se perder nas tarefas diárias e ignorar sinais do corpo. O desconforto se torna algo “normal” até que algo maior aconteça. Aqui na Vibe Terapias, queremos que você se permita pausar e cuidar de si mesmo, antes que seja tarde demais. Hoje, faça uma pausa e observe seu corpo com a gente. Agende sua sessão e descubra como podemos ajudar você a aliviar as dores e recuperar sua qualidade de vida. Vem pra Vibe',
    createdAt: new Date(),
    likesCount: 215
  },
  {
    id: 'post-4',
    authorUID: 'admin',
    authorName: 'Vibe Terapias',
    authorPhoto: 'https://picsum.photos/seed/vibe1/200/200',
    imageURL: 'https://instagram.fldb1-1.fna.fbcdn.net/v/t51.82787-15/658663834_17958565509102650_671052658738926454_n.jpg?stp=dst-jpg_e35_tt6&_nc_cat=107&ig_cache_key=Mzg2NjczNTQ0MDY5NTQ2OTM5MQ%3D%3D.3-ccb7-5&ccb=7-5&_nc_sid=58cdad&efg=eyJ2ZW5jb2RlX3RhZyI6InhwaWRzLjE0NDB4MTkyMC5zZHIuQzMifQ%3D%3D&_nc_ohc=dLsgu8JCF0QQ7kNvwEFbmNZ&_nc_oc=Adrb_RO55Rkw8cq7hPK_3h8wBJiWVhxf6dKv4xXDBA0e_toLBbGu95rdyqw0mlzG_hJ3en6kT6SmGgrKChCpySpW&_nc_ad=z-m&_nc_cid=0&_nc_zt=23&_nc_ht=instagram.fldb1-1.fna&_nc_gid=-ifJ0auyMCoS_bA1bC6pvw&_nc_ss=7a32e&oh=00_Af2-66mFXxhfDleOty6AxLwHUrwc5MRW560XxJZql2y_Hw&oe=69D81C85',
    caption: 'Dia Mundial de Conscientização do Autismo. Neste dia 2 de abril, celebramos a inclusão e a conscientização sobre o autismo. Cada pessoa é única e respeitar as diferenças é o primeiro passo para construir um mundo mais empático e inclusivo. Na Vibe Terapias, valorizamos a diversidade e trabalhamos com amor e cuidado para oferecer terapias que atendam às necessidades de cada indivíduo. Juntos, podemos criar um ambiente mais acolhedor para todos.',
    createdAt: new Date(),
    likesCount: 156
  }
];

const VISITOR_USER: UserProfile = {
  uid: 'visitor-' + Math.random().toString(36).substr(2, 9),
  displayName: 'Visitante',
  photoURL: 'https://ui-avatars.com/api/?name=Visitante&background=random',
  email: 'visitante@exemplo.com',
  role: 'user'
};

// --- Main App ---

export default function App() {
  const [user] = useState<UserProfile>(VISITOR_USER);
  const [posts, setPosts] = useState<Post[]>(INITIAL_POSTS);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);

  const handleDeletePost = (postId: string) => {
    if (!window.confirm('Tem certeza que deseja excluir esta publicação?')) return;
    setPosts(prev => prev.filter(p => p.id !== postId));
  };

  const handleAddPost = (newPost: Post) => {
    setPosts(prev => [newPost, ...prev]);
  };

  return (
    <div className="min-h-screen bg-gray-50 pt-20 pb-10">
      <Navbar 
        user={user} 
        onLogout={() => {}} 
        onOpenCreatePost={() => setIsCreateModalOpen(true)} 
      />

      <main className="max-w-lg mx-auto px-4">
        {posts.map(post => (
          <PostCard 
            key={post.id} 
            post={post} 
            currentUser={user} 
            onDelete={handleDeletePost}
          />
        ))}
      </main>

      <CreatePostModal 
        isOpen={isCreateModalOpen} 
        onClose={() => setIsCreateModalOpen(false)} 
        currentUser={user}
        onAddPost={handleAddPost}
      />
    </div>
  );
}
