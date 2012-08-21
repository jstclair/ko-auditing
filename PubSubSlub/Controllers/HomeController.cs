using System;
using System.Collections.Concurrent;
using System.Collections.Generic;
using System.Linq;
using System.Net;
using System.Web.Mvc;
using Newtonsoft.Json;

namespace PubSubSlub.Controllers
{
    public class HomeController : Controller
    {
        private static readonly ConcurrentDictionary<string, List<History>> _storage = new ConcurrentDictionary<string, List<History>>();

        [HttpGet]
        public ActionResult Index(string userId)
        {
            var items = _storage.GetOrAdd(userId, s => new List<History>())
                .OrderBy(x => x.time)
                .ToArray();

            return new JsonNetResult
                {
                    ContentEncoding = System.Text.Encoding.UTF8,
                    ContentType = "application/json",
                    Data = items,
                    JsonRequestBehavior = JsonRequestBehavior.AllowGet
                };
        }

        [HttpPost, ActionName("Index")]
        public ActionResult Post(History item)
        {
            if (item == null || string.IsNullOrWhiteSpace(item.userId))
                return new HttpStatusCodeResult(HttpStatusCode.BadRequest);
            _storage.AddOrUpdate(item.userId,
                                 s => new List<History> { item },
                                 (_, list) =>
                                     {
                                         list.Add(item);
                                         return list;
                                     });
            return new HttpStatusCodeResult(HttpStatusCode.OK);
        }

    }

    public class History
    {
        public string @property { get; set; }
        public string original { get; set; }
        public string current { get; set; }
        public DateTime time { get; set; }
        public string userId { get; set; }
    }

    public class JsonNetResult : JsonResult
    {
        public JsonNetResult()
        {
            JsonRequestBehavior = JsonRequestBehavior.DenyGet;
        }

        public override void ExecuteResult(ControllerContext context)
        {
            if (context == null)
            {
                throw new ArgumentNullException("context");
            }

            if (JsonRequestBehavior == JsonRequestBehavior.DenyGet &&
                String.Equals(context.HttpContext.Request.HttpMethod, "GET", StringComparison.OrdinalIgnoreCase))
            {
                throw new InvalidOperationException("GET not allowed");
            }

            var response = context.HttpContext.Response;
            response.ContentType = !String.IsNullOrEmpty(ContentType) ? ContentType : "application/json";

            if (ContentEncoding != null)
            {
                response.ContentEncoding = ContentEncoding;
            }

            if (Data == null) return;

            var jsonSerializer = new JsonSerializer();
            jsonSerializer.Serialize(response.Output, Data);
        }
    }

}
