import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Star, MessageSquare, Calendar, User, Search, Filter, Trash2, Heart, BarChart3 } from 'lucide-react';
import { db } from '../firebase';
import { collection, query, where, onSnapshot, orderBy, deleteDoc, doc, updateDoc } from 'firebase/firestore';
import { Review, Visitor } from '../types';
import Swal from 'sweetalert2';

interface ReviewsTabProps {
  organizationId: string;
  userRole: 'ADMIN' | 'STAFF';
  visitors: Visitor[];
}

export default function ReviewsTab({ organizationId, userRole, visitors }: ReviewsTabProps) {
  const [searchTerm, setSearchTerm] = useState('');
  const [ratingFilter, setRatingFilter] = useState<number | 'all'>('all');

  const reviews = React.useMemo(() => {
    return visitors
      .filter(v => v.review && !v.review.deleted)
      .map(v => ({
        id: v.visitorId,
        rating: v.review!.rating,
        comment: v.review!.comment,
        visitorId: v.visitorId,
        organizationId: v.organizationId,
        timestamp: v.review!.timestamp,
        deleted: v.review!.deleted
      } as Review))
      .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
  }, [visitors]);

  const handleDeleteReview = async (reviewId: string) => {
    if (userRole !== 'ADMIN') return;

    const result = await Swal.fire({
      title: 'Delete Review?',
      text: "This feedback will be permanently removed.",
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#ef4444',
      cancelButtonColor: '#64748b',
      confirmButtonText: 'Yes, Delete',
      cancelButtonText: 'Cancel'
    });

    if (result.isConfirmed) {
      try {
        await updateDoc(doc(db, 'organizations', organizationId, 'visits', reviewId), {
          'review.deleted': true,
          'review.deletedAt': new Date().toISOString()
        });
        Swal.fire('Deleted!', 'Review has been removed from view.', 'success');
      } catch (error) {
        console.error('Error deleting review:', error);
        Swal.fire('Error', 'Failed to delete review.', 'error');
      }
    }
  };

  const filteredReviews = reviews.filter(review => {
    const visitor = visitors.find(v => v.visitorId === review.visitorId);
    const matchesSearch = 
      (visitor?.name?.toLowerCase().includes(searchTerm.toLowerCase())) ||
      (review.comment?.toLowerCase().includes(searchTerm.toLowerCase()));
    
    const matchesRating = ratingFilter === 'all' || review.rating === ratingFilter;
    
    return matchesSearch && matchesRating;
  });

  const averageRating = reviews.length > 0 
    ? (reviews.reduce((acc, current) => acc + current.rating, 0) / reviews.length).toFixed(1)
    : '0.0';

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      {/* Header & Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="flex flex-col justify-center">
          <h2 className="text-3xl font-black text-gray-900 tracking-tight">Visitor Reviews</h2>
          <p className="text-gray-500 font-bold mt-1 uppercase tracking-widest text-xs">Customer feedback and ratings</p>
        </div>
        
        <div className="bg-white p-6 rounded-3xl shadow-sm border border-gray-100 flex items-center justify-between">
          <div className="flex flex-col">
            <span className="text-xs font-black text-gray-400 uppercase tracking-widest">Average Rating</span>
            <span className="text-4xl font-black text-gray-900">{averageRating}</span>
          </div>
          <div className="flex flex-col items-end">
            <div className="flex gap-1 mb-1">
              {[1, 2, 3, 4, 5].map(s => (
                <Star key={s} className={`h-4 w-4 ${s <= Math.round(Number(averageRating)) ? 'fill-amber-400 text-amber-400' : 'text-gray-200'}`} />
              ))}
            </div>
            <span className="text-xs font-bold text-brand-blue">Based on {reviews.length} reviews</span>
          </div>
        </div>

        <div className="bg-white p-8 rounded-[2rem] shadow-sm border border-gray-100 md:col-span-3 lg:col-span-1">
          <div className="flex items-center gap-4 mb-6">
            <div className="h-10 w-10 bg-blue-50 rounded-xl flex items-center justify-center">
              <BarChart3 className="h-5 w-5 text-brand-blue" />
            </div>
            <h3 className="text-sm font-black text-gray-900 uppercase tracking-widest">Rating Distribution</h3>
          </div>
          <div className="space-y-3">
            {[5, 4, 3, 2, 1].map((rating) => {
              const count = reviews.filter(r => r.rating === rating).length;
              const percentage = reviews.length > 0 ? (count / reviews.length) * 100 : 0;
              return (
                <div key={rating} className="flex items-center gap-4">
                  <div className="flex items-center gap-1 w-8">
                    <span className="text-xs font-black text-gray-600">{rating}</span>
                    <Star className="h-3 w-3 fill-amber-400 text-amber-400" />
                  </div>
                  <div className="flex-1 h-2 bg-gray-50 rounded-full overflow-hidden">
                    <motion.div 
                      initial={{ width: 0 }}
                      animate={{ width: `${percentage}%` }}
                      className="h-full bg-amber-400 rounded-full"
                    />
                  </div>
                  <span className="text-[10px] font-black text-gray-400 w-8 text-right">{count}</span>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="flex flex-col md:flex-row gap-4 items-center justify-between">
        <div className="relative w-full md:w-96 group">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400 group-focus-within:text-brand-blue transition-colors" />
          <input
            type="text"
            placeholder="Search reviews or visitors..."
            className="w-full pl-12 pr-4 py-4 bg-white border border-gray-200 rounded-2xl focus:border-brand-blue focus:ring-4 focus:ring-brand-blue/5 outline-none transition-all font-bold text-gray-900 shadow-sm"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>

        <div className="flex items-center gap-2 overflow-x-auto pb-2 md:pb-0 w-full md:w-auto">
          <button
            onClick={() => setRatingFilter('all')}
            className={`px-6 py-3 rounded-xl text-xs font-black uppercase tracking-widest transition-all whitespace-nowrap ${
              ratingFilter === 'all' 
                ? 'bg-brand-blue text-white shadow-lg shadow-blue-500/20' 
                : 'bg-white text-gray-400 hover:text-brand-blue border border-gray-100'
            }`}
          >
            All Ratings
          </button>
          {[5, 4, 3, 2, 1].map(r => (
            <button
              key={r}
              onClick={() => setRatingFilter(r)}
              className={`px-4 py-3 rounded-xl text-xs font-black uppercase tracking-widest transition-all whitespace-nowrap flex items-center gap-2 border ${
                ratingFilter === r 
                  ? 'bg-amber-400 border-amber-400 text-white shadow-lg shadow-amber-500/20' 
                  : 'bg-white border-gray-100 text-gray-400 hover:text-amber-500'
              }`}
            >
              <Star className={`h-3 w-3 ${ratingFilter === r ? 'fill-white' : ''}`} />
              {r} Star
            </button>
          ))}
        </div>
      </div>

      {/* Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        <AnimatePresence>
          {filteredReviews.length === 0 ? (
            <div className="col-span-full py-20 text-center bg-gray-50/50 rounded-[3rem] border border-dashed border-gray-200">
              <div className="inline-flex p-6 bg-white rounded-full shadow-sm border border-gray-100 mb-6">
                <MessageSquare className="h-10 w-10 text-gray-300" />
              </div>
              <h3 className="text-xl font-black text-gray-900">No reviews found</h3>
              <p className="text-gray-500 font-bold mt-2 uppercase tracking-widest text-[10px]">Try adjusting your search or filters</p>
            </div>
          ) : (
            filteredReviews.map((review) => {
              const visitor = visitors.find(v => v.visitorId === review.visitorId);
              return (
                <motion.div
                  key={review.id}
                  layout
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.95 }}
                  className="bg-white p-6 rounded-[2rem] shadow-sm border border-gray-100 hover:shadow-xl hover:border-brand-blue/20 transition-all flex flex-col group"
                >
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center gap-1">
                      {[1, 2, 3, 4, 5].map(s => (
                        <Star key={s} className={`h-4 w-4 ${s <= review.rating ? 'fill-amber-400 text-amber-400' : 'text-gray-100'}`} />
                      ))}
                    </div>
                    {userRole === 'ADMIN' && (
                      <button
                        onClick={() => handleDeleteReview(review.id)}
                        className="p-2 text-gray-300 hover:text-red-500 transition-colors opacity-0 group-hover:opacity-100"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    )}
                  </div>

                  <p className="text-gray-700 font-bold mb-6 italic leading-relaxed line-clamp-4">
                    "{review.comment || 'No comment provided'}"
                  </p>

                  <div className="mt-auto pt-6 border-t border-gray-50 flex items-center gap-4">
                    <div className="w-12 h-12 bg-gray-50 rounded-2xl flex items-center justify-center border border-gray-100 shrink-0">
                      <User className="h-6 w-6 text-gray-400" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-black text-gray-900 truncate">
                        {visitor?.name || 'Unknown Visitor'}
                      </p>
                      <div className="flex items-center gap-2 text-[10px] font-bold text-gray-400 uppercase tracking-widest">
                        <Calendar className="h-3 w-3" />
                        {new Date(review.timestamp).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })}
                      </div>
                    </div>
                  </div>
                </motion.div>
              );
            })
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
