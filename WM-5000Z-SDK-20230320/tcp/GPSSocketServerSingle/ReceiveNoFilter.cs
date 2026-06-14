using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using SuperSocket.SocketBase.Protocol;

namespace SuperSocket.QuickStart.GPSSocketServer
{
    public abstract class ReceiveNoFilter<TRequestInfo> : ReceiveFilterBase<TRequestInfo> where TRequestInfo : IRequestInfo
    {
        /// <summary>
        /// Null request info
        /// </summary>
        protected TRequestInfo NullRequestInfo = default(TRequestInfo);

        /// <summary>
        /// Initializes a new instance of the <see cref="BeginEndMarkReceiveFilter&lt;TRequestInfo&gt;"/> class.
        /// </summary>
        /// <param name="beginMark">The begin mark.</param>
        /// <param name="endMark">The end mark.</param>
        protected ReceiveNoFilter()
        {
        }

        /// <summary>
        /// Filters the specified session.
        /// </summary>
        /// <param name="readBuffer">The read buffer.</param>
        /// <param name="offset">The offset.</param>
        /// <param name="length">The length.</param>
        /// <param name="toBeCopied">if set to <c>true</c> [to be copied].</param>
        /// <param name="rest">The rest.</param>
        /// <returns></returns>
        public override TRequestInfo Filter(byte[] readBuffer, int offset, int length, bool toBeCopied, out int rest)
        {
            rest = 0;

            var requestInfo = ProcessMatchedRequest(readBuffer, offset, length);

            if (!ReferenceEquals(requestInfo, NullRequestInfo))
            {
                Reset();
                return requestInfo;
            }
            AddArraySegment(readBuffer, offset, length, toBeCopied);
            return NullRequestInfo;

        }

        /// <summary>
        /// Processes the matched request.
        /// </summary>
        /// <param name="readBuffer">The read buffer.</param>
        /// <param name="offset">The offset.</param>
        /// <param name="length">The length.</param>
        /// <returns></returns>
        protected abstract TRequestInfo ProcessMatchedRequest(byte[] readBuffer, int offset, int length);

        /// <summary>
        /// Resets this instance.
        /// </summary>
        public override void Reset()
        {
            base.Reset();
        }
    }
}
