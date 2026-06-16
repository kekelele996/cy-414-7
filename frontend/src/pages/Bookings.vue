<template>
  <div class="section-band">
    <section class="grid-3">
      <div class="metric-tile">
        <span>待确认</span>
        <strong>{{ stats.pending }}</strong>
      </div>
      <div class="metric-tile">
        <span>已确认</span>
        <strong>{{ stats.confirmed }}</strong>
      </div>
      <div class="metric-tile">
        <span>已完成</span>
        <strong>{{ stats.completed }}</strong>
      </div>
    </section>

    <section v-if="bookingStore.list.length" class="list-stack">
      <article v-for="booking in bookingStore.list" :key="booking.id" class="booking-row">
        <div class="booking-main">
          <h3>{{ booking.course?.title || `课程 #${booking.courseId}` }}</h3>
          <p>{{ formatDateTime(booking.scheduleTime) }} · {{ booking.note || '无备注' }}</p>
          <p v-if="booking.coachFeedback" class="feedback-preview">
            <span class="feedback-label">教练反馈：</span>
            <span class="feedback-text">{{ booking.coachFeedback }}</span>
          </p>
        </div>
        <BookingStatusBadge :status="booking.status" />
        <div class="toolbar">
          <el-tooltip content="取消预约" placement="top">
            <el-button v-if="canCancel(booking.status)" :icon="XCircle" circle @click="bookingStore.setStatus(booking.id, BookingStatus.CANCELLED)" />
          </el-tooltip>
          <el-tooltip content="完成打卡" placement="top">
            <el-button v-if="canComplete(booking.status)" type="primary" :icon="CheckCircle2" circle @click="bookingStore.setStatus(booking.id, BookingStatus.COMPLETED)" />
          </el-tooltip>
          <el-tooltip v-if="canViewFeedback(booking.status)" content="查看反馈" placement="top">
            <el-button :icon="MessageSquare" circle @click="viewFeedback(booking)" />
          </el-tooltip>
          <el-tooltip v-if="canWriteFeedback(booking.status)" :content="booking.coachFeedback ? '编辑反馈' : '写反馈'" placement="top">
            <el-button type="success" :icon="Edit3" circle @click="openFeedbackDialog(booking)" />
          </el-tooltip>
        </div>
      </article>
    </section>
    <EmptyState v-else title="还没有预约" description="预约课程后会在这里跟踪确认和打卡状态" />

    <el-dialog v-model="feedbackDialogVisible" :title="feedbackDialogTitle" width="500px">
      <el-form v-if="isCoach" label-position="top">
        <el-form-item label="训练总结">
          <el-input
            v-model="feedbackForm.coachFeedback"
            type="textarea"
            :rows="6"
            maxlength="2000"
            show-word-limit
            placeholder="请输入本次训练的总结和建议..."
          />
        </el-form-item>
      </el-form>
      <div v-else class="feedback-view">
        <p>{{ currentBooking?.coachFeedback || '暂无教练反馈' }}</p>
      </div>
      <template #footer>
        <el-button @click="feedbackDialogVisible = false">关闭</el-button>
        <el-button v-if="isCoach" type="primary" @click="saveFeedback">保存</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup lang="ts">
import { onMounted, ref, computed } from 'vue'
import { CheckCircle2, XCircle, Edit3, MessageSquare } from '@lucide/vue'
import { ElMessage } from 'element-plus'
import BookingStatusBadge from '@/components/common/BookingStatusBadge.vue'
import EmptyState from '@/components/common/EmptyState.vue'
import { BookingActionVisibleMatrix, BookingStatus, type BookingStatusValue } from '@/constants/booking'
import { useBookingStats } from '@/hooks/useBookingStats'
import { useBookingStore } from '@/stores/bookingStore'
import { useAuthStore } from '@/stores/authStore'
import { formatDateTime } from '@/utils/dateFormat'
import type { Booking } from '@/types/domain'

const bookingStore = useBookingStore()
const authStore = useAuthStore()
const { stats } = useBookingStats()

const feedbackDialogVisible = ref(false)
const currentBooking = ref<Booking | null>(null)
const feedbackForm = ref({ coachFeedback: '' })

const isCoach = computed(() => authStore.isCoach || authStore.isAdmin)

const feedbackDialogTitle = computed(() => {
  if (!currentBooking.value) return ''
  const courseTitle = currentBooking.value.course?.title || '课程'
  return isCoach.value ? (currentBooking.value.coachFeedback ? '编辑训练总结' : '写训练总结') : '教练反馈'
})

const canCancel = (status: BookingStatusValue) => BookingActionVisibleMatrix[status].includes('cancel')
const canComplete = (status: BookingStatusValue) => BookingActionVisibleMatrix[status].includes('complete')
const canViewFeedback = (status: BookingStatusValue) => {
  return status === BookingStatus.COMPLETED && !isCoach.value
}
const canWriteFeedback = (status: BookingStatusValue) => {
  return status === BookingStatus.COMPLETED && isCoach.value
}

function viewFeedback(booking: Booking) {
  currentBooking.value = booking
  feedbackForm.value.coachFeedback = booking.coachFeedback || ''
  feedbackDialogVisible.value = true
}

function openFeedbackDialog(booking: Booking) {
  currentBooking.value = booking
  feedbackForm.value.coachFeedback = booking.coachFeedback || ''
  feedbackDialogVisible.value = true
}

async function saveFeedback() {
  if (!currentBooking.value) return
  try {
    await bookingStore.updateFeedback(currentBooking.value.id, feedbackForm.value.coachFeedback)
    ElMessage.success('训练总结已保存')
    feedbackDialogVisible.value = false
  } catch {
    ElMessage.error('保存失败，请重试')
  }
}

onMounted(() => bookingStore.loadBookings())
</script>

<style scoped>
.booking-main {
  flex: 1;
  min-width: 0;
}

.feedback-preview {
  margin-top: 6px;
  font-size: 13px;
  color: var(--el-text-color-secondary);
  display: flex;
  gap: 4px;
}

.feedback-label {
  color: var(--el-color-primary);
  font-weight: 500;
  flex-shrink: 0;
}

.feedback-text {
  overflow: hidden;
  text-overflow: ellipsis;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
}

.feedback-view {
  padding: 12px 0;
  line-height: 1.7;
  color: var(--el-text-color-regular);
}
</style>
